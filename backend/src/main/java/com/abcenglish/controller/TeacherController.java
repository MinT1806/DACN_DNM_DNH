package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.ExerciseQuestion;
import com.abcenglish.entity.Lesson;
import com.abcenglish.service.TeacherContentService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherController {

    private final TeacherContentService teacherService;
    private final JwtService jwtService;

    public TeacherController(TeacherContentService teacherService, JwtService jwtService) {
        this.teacherService = teacherService;
        this.jwtService = jwtService;
    }

    private Long getUserId(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        return userId;
    }

    // ─── Lessons ───────────────────────────────────────────────────────────────

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createLesson(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        Long courseId = parseLong(body.get("courseId"));
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        String videoUrl = body.get("videoUrl") != null ? body.get("videoUrl").toString() : null;
        int orderIndex = body.get("orderIndex") != null ? ((Number) body.get("orderIndex")).intValue() : 0;
        int duration = body.get("durationMinutes") != null ? ((Number) body.get("durationMinutes")).intValue() : 15;

        Lesson lesson = teacherService.createLessonForApproval(courseId, title, content, videoUrl, orderIndex, duration, userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", lesson.getId(), "title", lesson.getTitle())));
    }

    @PostMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateLesson(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        String videoUrl = body.get("videoUrl") != null ? body.get("videoUrl").toString() : null;
        int orderIndex = body.get("orderIndex") != null ? ((Number) body.get("orderIndex")).intValue() : -1;
        int duration = body.get("durationMinutes") != null ? ((Number) body.get("durationMinutes")).intValue() : 0;

        Lesson lesson = teacherService.createLessonForApproval(null, title, content, videoUrl, orderIndex, duration, null);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id)));
    }

    // ─── Exercises ─────────────────────────────────────────────────────────────

    @PostMapping("/exercises")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExercise(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        Long courseId = parseLong(body.get("courseId"));
        Long lessonId = parseLong(body.get("lessonId"));
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String type = body.get("type") != null ? body.get("type").toString() : "MIXED";
        String level = body.get("level") != null ? body.get("level").toString() : "A1";
        String topic = body.get("topic") != null ? body.get("topic").toString() : null;
        int duration = body.get("durationMinutes") != null ? ((Number) body.get("durationMinutes")).intValue() : 15;
        int maxScore = body.get("maxScore") != null ? ((Number) body.get("maxScore")).intValue() : 10;

        Exercise exercise = teacherService.createExercise(courseId, lessonId, title, description, type, level, topic, duration, maxScore, userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", exercise.getId(), "title", exercise.getTitle())));
    }

    @PostMapping("/exercises/{id}/questions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addQuestion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String question = (String) body.get("question");
        String type = body.get("type") != null ? body.get("type").toString() : "MULTIPLE_CHOICE";
        List<String> options = body.get("options") != null ? (List<String>) body.get("options") : null;
        String correctAnswer = body.get("correctAnswer") != null ? body.get("correctAnswer").toString() : null;
        String explanation = body.get("explanation") != null ? body.get("explanation").toString() : null;
        int points = body.get("points") != null ? ((Number) body.get("points")).intValue() : 1;
        int orderIndex = body.get("orderIndex") != null ? ((Number) body.get("orderIndex")).intValue() : 0;

        ExerciseQuestion q = teacherService.addQuestion(id, question, type, options, correctAnswer, explanation, points, orderIndex);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", q.getId())));
    }

    // ─── AI Generation ─────────────────────────────────────────────────────────

    @PostMapping("/generate-exercises")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateExercises(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        String type = body.get("type") != null ? body.get("type").toString() : "GRAMMAR";
        String level = body.get("level") != null ? body.get("level").toString() : "A1";
        String topic = body.get("topic") != null ? body.get("topic").toString() : "General English";

        List<Map<String, Object>> questions = teacherService.generateExercisesWithAI(null, type, level, topic);

        Long courseId = parseLong(body.get("courseId"));
        Long lessonId = parseLong(body.get("lessonId"));
        String title = body.get("title") != null ? body.get("title").toString() : topic + " - " + type;

        Exercise saved = null;
        if (Boolean.TRUE.equals(body.get("save"))) {
            saved = teacherService.saveGeneratedExercise(courseId, lessonId, title, type, level, topic, questions, userId);
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("questions", questions);
        result.put("topic", topic);
        result.put("level", level);
        result.put("type", type);
        if (saved != null) {
            result.put("exerciseId", saved.getId());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/generate-from-content")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateFromContent(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        String content = (String) body.get("content");
        String level = body.get("level") != null ? body.get("level").toString() : "A1";
        String topic = body.get("topic") != null ? body.get("topic").toString() : "Lesson Content";
        int count = body.get("count") != null ? ((Number) body.get("count")).intValue() : 5;

        List<Map<String, Object>> questions = teacherService.generateQuestionsFromContent(content, level, topic, count);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("questions", questions, "topic", topic, "level", level)));
    }

    // ─── Submissions ────────────────────────────────────────────────────────────

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSubmissions(HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        return ResponseEntity.ok(ApiResponse.ok(teacherService.getPendingApprovals(userId)));
    }

    private Long parseLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try { return Long.parseLong(obj.toString()); } catch (Exception e) { return null; }
    }
}
