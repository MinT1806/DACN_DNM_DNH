package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.DailyChallengeService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/daily")
@CrossOrigin(origins = "*")
@Slf4j
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;
    private final JwtService jwtService;

    public DailyChallengeController(DailyChallengeService dailyChallengeService, JwtService jwtService) {
        this.dailyChallengeService = dailyChallengeService;
        this.jwtService = jwtService;
    }

    private Long extractUserId(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userId = jwtService.extractUserIdFromToken(authHeader.substring(7));
            }
        }
        return userId;
    }

    /**
     * GET /api/daily
     * Get today's full daily challenge with all 4 sections
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayChallenge(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            log.info("Getting today's challenge for userId={}", userId);
            Map<String, Object> challenge = dailyChallengeService.getTodayChallenge(userId);
            return ResponseEntity.ok(ApiResponse.ok(challenge));
        } catch (Exception e) {
            log.error("Error getting today's challenge: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("Không thể lấy thử thách: " + e.getMessage()));
        }
    }

    /**
     * POST /api/daily/submit
     * Submit challenge answers and get graded results
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitChallenge(
            @RequestBody Map<String, Object> submissionData,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            log.info("Submitting challenge for userId={}", userId);
            Map<String, Object> result = dailyChallengeService.submitChallenge(userId, submissionData);

            if (Boolean.TRUE.equals(result.get("alreadyCompleted"))) {
                return ResponseEntity.ok(ApiResponse.ok(result));
            }

            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Error submitting challenge: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("Không thể nộp bài: " + e.getMessage()));
        }
    }

    /**
     * GET /api/daily/week
     * Get weekly progress (Mon-Sun)
     */
    @GetMapping("/week")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWeeklyProgress(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            List<Map<String, Object>> weeklyProgress = dailyChallengeService.getWeeklyProgress(userId);
            return ResponseEntity.ok(ApiResponse.ok(weeklyProgress));
        } catch (Exception e) {
            log.error("Error getting weekly progress: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("Không thể lấy tiến độ tuần: " + e.getMessage()));
        }
    }

    /**
     * GET /api/daily/streak
     * Get current streak info
     */
    @GetMapping("/streak")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStreak(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            Map<String, Object> streakInfo = dailyChallengeService.getStreakInfo(userId);
            return ResponseEntity.ok(ApiResponse.ok(streakInfo));
        } catch (Exception e) {
            log.error("Error getting streak: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("Không thể lấy streak: " + e.getMessage()));
        }
    }

    /**
     * GET /api/daily/history
     * Get challenge history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHistory(
            @RequestParam(defaultValue = "10") int limit,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            List<Map<String, Object>> history = dailyChallengeService.getChallengeHistory(userId, limit);
            return ResponseEntity.ok(ApiResponse.ok(history));
        } catch (Exception e) {
            log.error("Error getting history: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("Không thể lấy lịch sử: " + e.getMessage()));
        }
    }
}
