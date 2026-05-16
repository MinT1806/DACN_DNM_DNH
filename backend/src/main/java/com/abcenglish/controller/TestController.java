package com.abcenglish.controller;

import com.abcenglish.entity.Test;
import com.abcenglish.entity.TestSession;
import com.abcenglish.entity.User;
import com.abcenglish.repository.TestRepository;
import com.abcenglish.repository.TestSessionRepository;
import com.abcenglish.service.TestService;
import com.abcenglish.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class TestController {

    private final TestService testService;
    private final TestRepository testRepository;
    private final TestSessionRepository testSessionRepository;
    private final JwtService jwtService;
    private static final Logger log = LoggerFactory.getLogger(TestController.class);

    public TestController(TestService testService, TestRepository testRepository,
                         TestSessionRepository testSessionRepository, JwtService jwtService) {
        this.testService = testService;
        this.testRepository = testRepository;
        this.testSessionRepository = testSessionRepository;
        this.jwtService = jwtService;
    }

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        } catch (Exception e) {
            log.warn("Failed to extract userId from token: {}", e.getMessage());
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTests(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        List<Map<String, Object>> tests = testService.getAllTests(type, level, userId);
        return ResponseEntity.ok(tests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTestById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        Map<String, Object> test = testService.getTestById(id, userId);
        if (test.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(test);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Map<String, Object>> startTest(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization") String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        Map<String, Object> result = testService.startTest(id, userId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{testId}/submit/{sessionId}")
    public ResponseEntity<Map<String, Object>> submitTest(
            @PathVariable Long testId,
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> answers,
            @RequestHeader(value = "Authorization") String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        // Validate session ownership - security fix
        Optional<TestSession> sessionOpt = testSessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Test session not found"));
        }
        TestSession session = sessionOpt.get();
        if (!session.getUserId().equals(userId)) {
            log.warn("User {} attempted to submit session {} belonging to user {}",
                    userId, sessionId, session.getUserId());
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: session does not belong to you"));
        }
        if (session.getStatus() == TestSession.TestStatus.SUBMITTED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Test already submitted"));
        }

        Map<String, Object> result = testService.submitTest(testId, sessionId, answers, userId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/results")
    public ResponseEntity<List<Map<String, Object>>> getMyResults(
            @RequestHeader(value = "Authorization") String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(testService.getMyResults(userId));
    }

    @GetMapping("/results/{id}")
    public ResponseEntity<Map<String, Object>> getResultById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.notFound().build();
        }
        return testService.getMyResults(userId).stream()
                .filter(r -> r.get("id").equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTest(
            @RequestBody Map<String, Object> data,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = getUserIdFromToken(authHeader);
        try {
            Test test = testService.createTest(data, userId);
            Map<String, Object> result = new HashMap<>();
            result.put("id", test.getId());
            result.put("title", test.getTitle());
            result.put("message", "Test created successfully");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid data in createTest: {}", e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid test data: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Error creating test", e);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to create test");
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data
    ) {
        return testRepository.findById(id).map(test -> {
            if (data.containsKey("title")) test.setTitle((String) data.get("title"));
            if (data.containsKey("description")) test.setDescription((String) data.get("description"));
            if (data.containsKey("type")) {
                try { test.setType(Test.TestType.valueOf(data.get("type").toString().toUpperCase())); }
                catch (IllegalArgumentException e) { log.warn("Invalid test type: {}", data.get("type")); }
            }
            if (data.containsKey("level")) {
                try { test.setLevel(User.Level.valueOf(data.get("level").toString().toUpperCase())); }
                catch (IllegalArgumentException e) { log.warn("Invalid test level: {}", data.get("level")); }
            }
            if (data.containsKey("durationMinutes")) test.setDurationMinutes((Integer) data.get("durationMinutes"));
            if (data.containsKey("passingScore")) test.setPassingScore((Integer) data.get("passingScore"));
            if (data.containsKey("totalQuestions")) test.setTotalQuestions((Integer) data.get("totalQuestions"));
            if (data.containsKey("active")) test.setActive((Boolean) data.get("active"));
            if (data.containsKey("timed")) test.setTimed((Boolean) data.get("timed"));
            if (data.containsKey("questionData")) test.setQuestionData(data.get("questionData").toString());
            testRepository.save(test);
            Map<String, Object> success = new HashMap<>();
            success.put("success", true);
            success.put("message", "Test updated");
            return ResponseEntity.ok(success);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTest(@PathVariable Long id) {
        return testRepository.findById(id).map(test -> {
            test.setActive(false);
            testRepository.save(test);
            Map<String, Object> success = new HashMap<>();
            success.put("success", true);
            success.put("message", "Test deactivated");
            return ResponseEntity.ok(success);
        }).orElse(ResponseEntity.notFound().build());
    }
}
