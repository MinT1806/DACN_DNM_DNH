package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.VideoService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/video")
@CrossOrigin(origins = "*")
public class VideoController {

    private static final Logger log = LoggerFactory.getLogger(VideoController.class);

    private final VideoService videoService;
    private final JwtService jwtService;

    public VideoController(VideoService videoService, JwtService jwtService) {
        this.videoService = videoService;
        this.jwtService = jwtService;
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVideoData(@PathVariable Long lessonId) {
        try {
            Map<String, Object> data = videoService.getVideoData(lessonId);
            if (data == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("Lesson not found"));
            }
            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (Exception e) {
            log.error("Error getting video data: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load video: " + e.getMessage()));
        }
    }

    @PostMapping("/lookup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> lookupWord(@RequestBody Map<String, String> body) {
        try {
            String word = body.get("word");
            if (word == null || word.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Word is required"));
            }
            Map<String, Object> result = videoService.lookupWord(word);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Error looking up word: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to lookup word"));
        }
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveWordFromVideo(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            Object vocabIdObj = body.get("vocabularyId");
            if (vocabIdObj == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("vocabularyId is required"));
            }

            Long vocabularyId = vocabIdObj instanceof Number
                    ? ((Number) vocabIdObj).longValue()
                    : Long.parseLong(vocabIdObj.toString());

            boolean saved = videoService.saveWord(userId, vocabularyId);
            return ResponseEntity.ok(ApiResponse.ok(Map.of("saved", saved)));
        } catch (Exception e) {
            log.error("Error saving word: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to save word"));
        }
    }
}
