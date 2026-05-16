package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.User;
import com.abcenglish.repository.UserRepository;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.StoryService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@CrossOrigin(origins = "*")
public class StoryController {

    private static final Logger log = LoggerFactory.getLogger(StoryController.class);

    private final StoryService storyService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public StoryController(StoryService storyService, JwtService jwtService, UserRepository userRepository) {
        this.storyService = storyService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        }
        return null;
    }

    private User.Level getUserLevel(Long userId) {
        return userRepository.findById(userId)
                .map(u -> u.getLevel() != null ? u.getLevel() : User.Level.A1)
                .orElse(User.Level.A1);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllStories(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            User.Level level = userId != null ? getUserLevel(userId) : User.Level.A1;
            List<Map<String, Object>> stories = storyService.getAllStories(level);
            return ResponseEntity.ok(ApiResponse.ok(stories));
        } catch (Exception e) {
            log.error("Error getting stories: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load stories"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStory(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            Map<String, Object> story = storyService.getStoryById(id, userId);
            if (story == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("Story not found"));
            }
            return ResponseEntity.ok(ApiResponse.ok(story));
        } catch (Exception e) {
            log.error("Error getting story {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load story"));
        }
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAnswer(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            Integer stepOrder = parseInt(body.get("stepOrder"));
            String answer = (String) body.get("answer");

            if (stepOrder == null || answer == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("stepOrder and answer are required"));
            }

            Map<String, Object> result = storyService.submitAnswer(id, userId, stepOrder, answer);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Error submitting answer for story {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to submit answer"));
        }
    }

    @GetMapping("/progress")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserProgress(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            List<Map<String, Object>> progress = storyService.getUserStoryProgress(userId);
            return ResponseEntity.ok(ApiResponse.ok(progress));
        } catch (Exception e) {
            log.error("Error getting user story progress: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load progress"));
        }
    }

    private Integer parseInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
