package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.abcenglish.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/lesson-flow")
@CrossOrigin(origins = "*")
public class LessonFlowController {

    private final LessonRepository lessonRepository;
    private final LessonService lessonService;
    private final LessonContentService contentService;
    private final LessonProgressService progressService;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final TestFlowService testFlowService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public LessonFlowController(
            LessonRepository lessonRepository,
            LessonService lessonService,
            LessonContentService contentService,
            LessonProgressService progressService,
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            TestFlowService testFlowService,
            JwtService jwtService) {
        this.lessonRepository = lessonRepository;
        this.lessonService = lessonService;
        this.contentService = contentService;
        this.progressService = progressService;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.testFlowService = testFlowService;
        this.jwtService = jwtService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * GET /api/lesson-flow/{id}
     * Full lesson detail with content, exercises, test, progress, navigation
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonFlow(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        Map<String, Object> result = buildLessonFlow(id, userId);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/lesson-flow/{id}/content
     * Get only the learning content section
     */
    @GetMapping("/{id}/content")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonContent(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);

        Lesson lesson = lessonRepository.findById(id).orElse(null);
        if (lesson == null) return ResponseEntity.status(404).body(ApiResponse.error("Lesson not found"));

        Map<String, Object> contentData = contentService.getContentDetail(id);
        contentData.put("lessonId", id);
        contentData.put("lessonTitle", lesson.getTitle());
        contentData.put("videoUrl", lesson.getVideoUrl());

        if (userId != null) {
            progressService.markContentViewed(userId, id, lesson.getCourseId());
        }

        return ResponseEntity.ok(ApiResponse.ok(contentData));
    }

    /**
     * GET /api/lesson-flow/{id}/exercises
     * Get all exercises for a lesson
     */
    @GetMapping("/{id}/exercises")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLessonExercises(
            @PathVariable Long id) {
        Lesson lesson = lessonRepository.findById(id).orElse(null);
        if (lesson == null) return ResponseEntity.status(404).body(ApiResponse.error("Lesson not found"));

        List<Exercise> exercises = exerciseRepository.findByActiveTrue().stream()
                .filter(e -> {
                    String cat = e.getCategory();
                    if (cat == null) return false;
                    return cat.equals(String.valueOf(lesson.getCourseId())) ||
                           cat.contains("lesson_" + id);
                })
                .toList();

        List<Map<String, Object>> result = exercises.stream().map(e -> {
            Map<String, Object> ex = new LinkedHashMap<>();
            ex.put("id", e.getId());
            ex.put("title", e.getTitle());
            ex.put("type", e.getType() != null ? e.getType().name() : null);
            ex.put("description", e.getDescription());
            ex.put("duration", e.getDurationMinutes());
            ex.put("maxScore", e.getMaxScore());
            ex.put("instructions", e.getInstructions());
            ex.put("questionsCount", questionRepository.findByExerciseId(e.getId()).size());
            return ex;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/lesson-flow/{id}/exercise/{exerciseId}
     * Get exercise detail with questions
     */
    @GetMapping("/{id}/exercise/{exerciseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExerciseDetail(
            @PathVariable Long id,
            @PathVariable Long exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElse(null);
        if (exercise == null) return ResponseEntity.status(404).body(ApiResponse.error("Exercise not found"));

        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", exercise.getId());
        result.put("title", exercise.getTitle());
        result.put("description", exercise.getDescription());
        result.put("type", exercise.getType() != null ? exercise.getType().name() : null);
        result.put("level", exercise.getLevel() != null ? exercise.getLevel().name() : null);
        result.put("duration", exercise.getDurationMinutes());
        result.put("maxScore", exercise.getMaxScore());
        result.put("topic", exercise.getTopic());
        result.put("category", exercise.getCategory());
        result.put("instructions", exercise.getInstructions());
        result.put("content", exercise.getContent());

        List<Map<String, Object>> questionList = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("question", q.getQuestion());
            m.put("type", q.getType() != null ? q.getType().name() : null);
            m.put("content", q.getContent());
            m.put("options", parseOptions(q.getOptions()));
            m.put("orderIndex", q.getOrderIndex());
            m.put("points", q.getPoints());
            m.put("explanation", q.getExplanation());
            if (q.getType() != null && q.getType() == ExerciseQuestion.QuestionType.MATCHING) {
                m.put("correctAnswer", q.getCorrectAnswer());
            }
            return m;
        }).toList();
        result.put("questions", questionList);
        result.put("questionCount", questionList.size());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/lesson-flow/{id}/test
     * Get test for a lesson
     */
    @GetMapping("/{id}/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonTest(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        Map<String, Object> testData = testFlowService.getTestForLesson(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(testData));
    }

    /**
     * POST /api/lesson-flow/{id}/progress
     * Update section progress
     */
    @PostMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProgress(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        String section = body.get("section") != null ? body.get("section").toString() : "content";
        int score = body.get("score") != null ? ((Number) body.get("score")).intValue() : 0;
        int timeSpent = body.get("timeSpentSeconds") != null ? ((Number) body.get("timeSpentSeconds")).intValue() : 0;
        boolean completed = body.get("completed") != null && (Boolean) body.get("completed");

        Lesson lesson = lessonRepository.findById(id).orElse(null);
        Long courseId = lesson != null ? lesson.getCourseId() : null;

        LessonProgress progress = progressService.updateSection(userId, id, courseId, section, score, timeSpent, completed);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", progress.getId());
        result.put("contentViewed", progress.isContentViewed());
        result.put("exercisesCompleted", progress.isExercisesCompleted());
        result.put("testCompleted", progress.isTestCompleted());
        result.put("lessonCompleted", progress.isLessonCompleted());
        result.put("totalScore", progress.getTotalScore());
        result.put("timeSpentSeconds", progress.getTimeSpentSeconds());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildLessonFlow(Long lessonId, Long userId) {
        Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
        if (lesson == null) return null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", lesson.getId());
        result.put("title", lesson.getTitle());
        result.put("content", lesson.getContent());
        result.put("videoUrl", lesson.getVideoUrl());
        result.put("orderIndex", lesson.getOrderIndex());
        result.put("durationMinutes", lesson.getDurationMinutes());
        result.put("courseId", lesson.getCourseId());

        Map<String, Object> contentData = contentService.getContentDetail(lessonId);
        result.put("contentDetails", contentData);

        List<Exercise> exercises = exerciseRepository.findByActiveTrue().stream()
                .filter(e -> {
                    String cat = e.getCategory();
                    if (cat == null) return false;
                    return cat.equals(String.valueOf(lesson.getCourseId())) ||
                           cat.contains("lesson_" + lessonId);
                })
                .toList();

        List<Map<String, Object>> exerciseList = exercises.stream().map(e -> {
            Map<String, Object> ex = new LinkedHashMap<>();
            ex.put("id", e.getId());
            ex.put("title", e.getTitle());
            ex.put("type", e.getType() != null ? e.getType().name() : null);
            ex.put("duration", e.getDurationMinutes());
            ex.put("questionsCount", questionRepository.findByExerciseId(e.getId()).size());
            ex.put("maxScore", e.getMaxScore());
            return ex;
        }).toList();
        result.put("exercises", exerciseList);

        Map<String, Object> testData = testFlowService.getTestForLesson(lessonId, userId);
        result.put("test", testData.get("hasTest").equals(true) ? testData : null);

        if (userId != null) {
            Map<String, Object> progressData = progressService.getProgressDetail(userId, lessonId);
            result.put("progress", progressData);

            List<Lesson> siblings = lessonRepository.findByCourseIdOrderByOrderIndex(lesson.getCourseId());
            int idx = -1;
            for (int i = 0; i < siblings.size(); i++) {
                if (siblings.get(i).getId().equals(lessonId)) { idx = i; break; }
            }
            Map<String, Object> nav = new LinkedHashMap<>();
            nav.put("hasPrevious", idx > 0);
            nav.put("hasNext", idx < siblings.size() - 1);
            if (idx > 0) {
                Lesson prev = siblings.get(idx - 1);
                nav.put("previousId", prev.getId());
                nav.put("previousTitle", prev.getTitle());
            }
            if (idx < siblings.size() - 1) {
                Lesson next = siblings.get(idx + 1);
                nav.put("nextId", next.getId());
                nav.put("nextTitle", next.getTitle());
            }
            result.put("navigation", nav);
        }

        return result;
    }

    private Object parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            return objectMapper.readValue(options, Object.class);
        } catch (Exception e) {
            return options;
        }
    }
}
