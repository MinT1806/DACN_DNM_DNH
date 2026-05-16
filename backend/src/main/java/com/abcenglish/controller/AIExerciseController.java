package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.dto.AIExerciseConfig;
import com.abcenglish.dto.AIExerciseResponse.GradingResult;
import com.abcenglish.service.AIExerciseService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/ai-exercises")
@CrossOrigin(origins = "*")
public class AIExerciseController {

    private final AIExerciseService aiExerciseService;
    private final JwtService jwtService;

    public AIExerciseController(AIExerciseService aiExerciseService, JwtService jwtService) {
        this.aiExerciseService = aiExerciseService;
        this.jwtService = jwtService;
    }

    // ─── GET /api/ai-exercises/skills ────────────────────────────────────────────
    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<AIExerciseConfig.SkillOption>>> getSkills() {
        List<AIExerciseConfig.SkillOption> skills = aiExerciseService.getAvailableSkills();
        return ResponseEntity.ok(ApiResponse.ok(skills));
    }

    // ─── GET /api/ai-exercises/topics?skill=READING ──────────────────────────────
    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopics(@RequestParam String skill) {
        List<AIExerciseConfig.TopicOption> topics = aiExerciseService.getTopicsBySkill(skill);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("skill", skill);
        data.put("topics", topics);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ─── GET /api/ai-exercises/levels ─────────────────────────────────────────────
    @GetMapping("/levels")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getLevels() {
        List<Map<String, String>> levels = aiExerciseService.getAvailableLevels();
        return ResponseEntity.ok(ApiResponse.ok(levels));
    }

    // ─── POST /api/ai-exercises/generate ──────────────────────────────────────────
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateExercise(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        String skill = body.get("skill") != null ? body.get("skill").toString() : "READING";
        String topic = body.get("topic") != null ? body.get("topic").toString() : "general";
        String level = body.get("level") != null ? body.get("level").toString() : "A1";

        try {
            var data = aiExerciseService.generateExercise(skill, topic, level, userId);
            return ResponseEntity.ok(ApiResponse.ok(convertExerciseDataToMap(data)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── POST /api/ai-exercises/submit ────────────────────────────────────────────
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitExercise(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Long exerciseId = null;
        Object exId = body.get("exerciseId");
        if (exId instanceof Number) {
            exerciseId = ((Number) exId).longValue();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> answers = (Map<String, Object>) body.get("answers");
        if (answers == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Answers are required"));
        }

        if (exerciseId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("exerciseId is required"));
        }

        try {
            GradingResult grading = aiExerciseService.gradeExercise(exerciseId, answers, userId);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("exerciseId", exerciseId);
            data.put("grading", convertGradingResultToMap(grading));
            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── POST /api/ai-exercises/grade-single ──────────────────────────────────────
    @PostMapping("/grade-single")
    public ResponseEntity<ApiResponse<Map<String, Object>>> gradeSingleQuestion(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Long exerciseId = null;
        Long questionId = null;
        String answer = "";

        Object exId = body.get("exerciseId");
        if (exId instanceof Number) exerciseId = ((Number) exId).longValue();

        Object qId = body.get("questionId");
        if (qId instanceof Number) questionId = ((Number) qId).longValue();

        if (body.get("answer") != null) answer = body.get("answer").toString();

        if (exerciseId == null || questionId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("exerciseId and questionId are required"));
        }

        if (answer.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Answer cannot be empty"));
        }

        try {
            GradingResult grading = aiExerciseService.gradeSingleAnswer(exerciseId, questionId, answer, userId);
            return ResponseEntity.ok(ApiResponse.ok(convertGradingResultToMap(grading)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── POST /api/ai-exercises/transcribe ───────────────────────────────────────
    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcribeAudio(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Audio file is required"));
        }

        try {
            byte[] audioData = file.getBytes();
            String transcription = aiExerciseService.transcribeAudio(audioData, file.getOriginalFilename());

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("transcript", transcription != null ? transcription : "");
            data.put("fileName", file.getOriginalFilename());
            data.put("fileSize", audioData.length);

            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Transcription failed: " + e.getMessage()));
        }
    }

    // ─── POST /api/ai-exercises/grade-speaking ────────────────────────────────────
    @PostMapping("/grade-speaking")
    public ResponseEntity<ApiResponse<Map<String, Object>>> gradeSpeaking(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Long exerciseId = null;
        Long questionId = null;
        String transcribedText = "";

        Object exId = body.get("exerciseId");
        if (exId instanceof Number) exerciseId = ((Number) exId).longValue();

        Object qId = body.get("questionId");
        if (qId instanceof Number) questionId = ((Number) qId).longValue();

        if (body.get("transcribedText") != null) {
            transcribedText = body.get("transcribedText").toString();
        }

        if (exerciseId == null || questionId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("exerciseId and questionId are required"));
        }

        if (transcribedText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("transcribedText cannot be empty"));
        }

        try {
            GradingResult grading = aiExerciseService.gradeSingleAnswer(exerciseId, questionId, transcribedText, userId);
            grading.setTranscript(transcribedText);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("grading", convertGradingResultToMap(grading));
            data.put("transcript", transcribedText);

            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── GET /api/ai-exercises/history ────────────────────────────────────────────
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Object>>> getHistory(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private Map<String, Object> convertExerciseDataToMap(
            com.abcenglish.dto.AIExerciseResponse.AIExerciseData data) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("exerciseId", data.getExerciseId());
        m.put("title", data.getTitle());
        m.put("skill", data.getSkill());
        m.put("topic", data.getTopic());
        m.put("level", data.getLevel());
        m.put("questions", data.getQuestions());
        m.put("questionCount", data.getQuestionCount());
        m.put("durationMinutes", data.getDurationMinutes());
        m.put("content", null); // passage/script from exercise entity
        return m;
    }

    private Map<String, Object> convertGradingResultToMap(GradingResult grading) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("score", grading.getScore());
        m.put("feedback", grading.getFeedback());
        m.put("suggestions", grading.getSuggestions());
        m.put("details", grading.getDetails());
        m.put("transcript", grading.getTranscript());
        m.put("correctCount", grading.getCorrectCount());
        m.put("totalCount", grading.getTotalCount());
        m.put("questionResults", grading.getQuestionResults());
        m.put("xpEarned", grading.getXpEarned());
        m.put("overallFeedback", grading.getOverallFeedback());
        return m;
    }
}
