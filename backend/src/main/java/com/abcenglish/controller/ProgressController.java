package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.LessonProgress;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.LessonProgressService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
public class ProgressController {

    private final LessonProgressService progressService;
    private final JwtService jwtService;

    public ProgressController(LessonProgressService progressService, JwtService jwtService) {
        this.progressService = progressService;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/progress/lesson/{lessonId}
     * Get user's progress for a specific lesson
     */
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonProgress(
            @PathVariable Long lessonId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        Map<String, Object> progress = progressService.getProgressDetail(userId, lessonId);
        return ResponseEntity.ok(ApiResponse.ok(progress));
    }

    /**
     * GET /api/progress/course/{courseId}
     * Get user's progress for all lessons in a course
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCourseProgress(
            @PathVariable Long courseId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        List<Map<String, Object>> progress = progressService.getCourseProgress(userId, courseId);
        return ResponseEntity.ok(ApiResponse.ok(progress));
    }

    /**
     * GET /api/progress/stats
     * Get overall learning statistics for the user
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        Map<String, Object> stats = progressService.getUserStats(userId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
