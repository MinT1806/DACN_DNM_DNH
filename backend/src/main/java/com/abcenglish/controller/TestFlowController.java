package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.LessonTest;
import com.abcenglish.repository.LessonTestRepository;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.TestFlowService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestFlowController {

    private final TestFlowService testFlowService;
    private final LessonTestRepository testRepository;
    private final JwtService jwtService;

    public TestFlowController(
            TestFlowService testFlowService,
            LessonTestRepository testRepository,
            JwtService jwtService) {
        this.testFlowService = testFlowService;
        this.testRepository = testRepository;
        this.jwtService = jwtService;
    }

    /**
     * POST /api/tests/{testId}/start
     * Start a test session
     */
    @PostMapping("/{testId}/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startTest(
            @PathVariable Long testId,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        Long lessonId = null;
        if (body != null && body.get("lessonId") != null) {
            lessonId = ((Number) body.get("lessonId")).longValue();
        }

        try {
            Map<String, Object> result = testFlowService.startTest(lessonId, testId, userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/tests/{testId}/submit
     * Submit test answers
     */
    @PostMapping("/{testId}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitTest(
            @PathVariable Long testId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        String sessionId = body.get("sessionId") != null ? body.get("sessionId").toString() : null;
        @SuppressWarnings("unchecked")
        Map<String, Object> answers = body.get("answers") != null ?
                (Map<String, Object>) body.get("answers") : Map.of();
        int timeSpent = body.get("timeSpentSeconds") != null ?
                ((Number) body.get("timeSpentSeconds")).intValue() : 0;

        try {
            Map<String, Object> result = testFlowService.submitTest(
                    testId, sessionId, answers, timeSpent, userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/tests/history
     * Get user's test history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTestHistory(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        var history = testFlowService.getTestHistory(userId);
        var stats = testFlowService.getTestHistoryStats(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("history", history, "stats", stats)));
    }

    /**
     * POST /api/tests/create
     * Create a new lesson test (for teachers/admins)
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTest(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        try {
            Long lessonId = body.get("lessonId") != null ?
                    ((Number) body.get("lessonId")).longValue() : null;
            String title = body.get("title") != null ? body.get("title").toString() : "Lesson Test";
            String description = body.get("description") != null ? body.get("description").toString() : "";
            int duration = body.get("durationMinutes") != null ?
                    ((Number) body.get("durationMinutes")).intValue() : 30;
            int passingScore = body.get("passingScore") != null ?
                    ((Number) body.get("passingScore")).intValue() : 6;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = body.get("questions") != null ?
                    (List<Map<String, Object>>) body.get("questions") : new java.util.ArrayList<>();

            LessonTest test = testFlowService.createTest(lessonId, title, description, duration, passingScore, questions);

            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "id", test.getId(),
                    "title", test.getTitle(),
                    "message", "Test created successfully"
            )));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to create test: " + e.getMessage()));
        }
    }
}
