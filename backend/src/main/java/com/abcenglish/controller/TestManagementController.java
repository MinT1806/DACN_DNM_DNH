package com.abcenglish.controller;

import com.abcenglish.dto.*;
import com.abcenglish.service.AIGradingService;
import com.abcenglish.service.TestAIGradingService;
import com.abcenglish.service.TestManagementService;
import com.abcenglish.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/test-management")
@CrossOrigin(origins = "*")
public class TestManagementController {

    private static final Logger log = LoggerFactory.getLogger(TestManagementController.class);

    private final TestManagementService testManagementService;
    private final AIGradingService aiGradingService;
    private final TestAIGradingService testAIGradingService;
    private final JwtService jwtService;

    public TestManagementController(TestManagementService testManagementService,
                                  AIGradingService aiGradingService,
                                  TestAIGradingService testAIGradingService,
                                  JwtService jwtService) {
        this.testManagementService = testManagementService;
        this.aiGradingService = aiGradingService;
        this.testAIGradingService = testAIGradingService;
        this.jwtService = jwtService;
    }

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        } catch (Exception e) {
            log.warn("Failed to extract userId: {}", e.getMessage());
            return null;
        }
    }

    @PostMapping("/tests/{testId}/start")
    public ResponseEntity<Map<String, Object>> startTest(
            @PathVariable Long testId,
            @RequestBody(required = false) TestStartRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            TestSessionResponse response = testManagementService.startTest(testId, userId);
            Map<String, Object> result = toMap(response);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error starting test", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to start test"));
        }
    }

    @PostMapping("/sessions/{sessionId}/resume")
    public ResponseEntity<Map<String, Object>> resumeTest(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            TestSessionResponse response = testManagementService.resumeTest(sessionId, userId);
            return ResponseEntity.ok(toMap(response));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error resuming test", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to resume test"));
        }
    }

    @PostMapping("/sessions/{sessionId}/autosave")
    public ResponseEntity<Map<String, Object>> autoSave(
            @PathVariable Long sessionId,
            @RequestBody AutoSaveRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            request.setSessionId(sessionId);
            testManagementService.autoSave(request, userId);
            return ResponseEntity.ok(Map.of("success", true, "savedAt", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Error auto-saving", e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/tests/{testId}/submit")
    public ResponseEntity<Map<String, Object>> submitTest(
            @PathVariable Long testId,
            @RequestBody TestSubmitRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            TestResultResponse result = testManagementService.submitTest(testId, request, userId);
            return ResponseEntity.ok(toMap(result));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error submitting test", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to submit test"));
        }
    }

    @GetMapping("/results/{resultId}")
    public ResponseEntity<Map<String, Object>> getResult(
            @PathVariable Long resultId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            TestResultResponse result = testManagementService.getResult(resultId, userId);
            return ResponseEntity.ok(toMap(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting result", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get result"));
        }
    }

    @GetMapping("/sessions/in-progress")
    public ResponseEntity<List<Map<String, Object>>> getInProgressSessions(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.emptyList());
        }
        return ResponseEntity.ok(testManagementService.getInProgressSessions(userId));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSession(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        try {
            TestSessionResponse response = testManagementService.getSession(sessionId, userId);
            return ResponseEntity.ok(toMap(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting session", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get session"));
        }
    }

    @PostMapping("/grade/writing")
    public ResponseEntity<Map<String, Object>> gradeWriting(@RequestBody AIGradingRequest request) {
        try {
            com.abcenglish.dto.AIGradingResponse response = testAIGradingService.gradeWriting(request);
            return ResponseEntity.ok(toMap(response));
        } catch (Exception e) {
            log.error("Error grading writing", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to grade writing"));
        }
    }

    @PostMapping("/grade/speaking")
    public ResponseEntity<Map<String, Object>> gradeSpeaking(@RequestBody AIGradingRequest request) {
        try {
            com.abcenglish.dto.AIGradingResponse response = testAIGradingService.gradeSpeaking(request);
            return ResponseEntity.ok(toMap(response));
        } catch (Exception e) {
            log.error("Error grading speaking", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to grade speaking"));
        }
    }

    @PostMapping("/grade/batch")
    public ResponseEntity<Map<String, Object>> batchGrade(@RequestBody List<AIGradingRequest> requests) {
        try {
            Map<String, Object> results = testAIGradingService.batchGrade(requests);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error batch grading", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to batch grade"));
        }
    }

    @PostMapping("/sessions/{sessionId}/section/complete")
    public ResponseEntity<Map<String, Object>> completeSection(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> data,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "sessionId", sessionId,
            "completedSection", data.get("sectionType"),
            "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/sessions/{sessionId}/lock")
    public ResponseEntity<Map<String, Object>> lockSession(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "sessionId", sessionId,
            "locked", true,
            "lockedAt", System.currentTimeMillis()
        ));
    }

    private Map<String, Object> toMap(Object obj) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (obj == null) return map;

        try {
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String json = mapper.writeValueAsString(obj);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = mapper.readValue(json, Map.class);
            return result;
        } catch (Exception e) {
            log.error("Failed to convert object to map", e);
            return map;
        }
    }
}
