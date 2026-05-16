package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.UserProgress;
import com.abcenglish.service.LessonService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "*")
public class LessonController {

    private final LessonService lessonService;
    private final JwtService jwtService;

    public LessonController(LessonService lessonService, JwtService jwtService) {
        this.lessonService = lessonService;
        this.jwtService = jwtService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonById(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        Map<String, Object> lesson = lessonService.getLessonDetail(id, userId);
        if (lesson == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(lesson));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLessonsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(
                lessonService.getLessonsByCourse(courseId).stream().map(l -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", l.getId());
                    m.put("title", l.getTitle());
                    m.put("content", l.getContent());
                    m.put("videoUrl", l.getVideoUrl());
                    m.put("orderIndex", l.getOrderIndex());
                    m.put("durationMinutes", l.getDurationMinutes());
                    m.put("courseId", l.getCourseId());
                    return m;
                }).toList()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startLesson(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        return ResponseEntity.ok(ApiResponse.ok(lessonService.startLesson(id, userId)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<UserProgress>> completeLesson(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        int score = body.get("score") != null ? ((Number) body.get("score")).intValue() : 0;
        int timeSpent = body.get("timeSpent") != null ? ((Number) body.get("timeSpent")).intValue() : 0;
        UserProgress progress = lessonService.completeLesson(id, userId, score, timeSpent);
        return ResponseEntity.ok(ApiResponse.ok(progress));
    }
}
