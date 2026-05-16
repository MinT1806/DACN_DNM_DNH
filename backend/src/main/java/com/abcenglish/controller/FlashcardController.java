package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.FlashcardService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
@CrossOrigin(origins = "*")
public class FlashcardController {

    private static final Logger log = LoggerFactory.getLogger(FlashcardController.class);

    private final FlashcardService flashcardService;
    private final JwtService jwtService;

    public FlashcardController(FlashcardService flashcardService, JwtService jwtService) {
        this.flashcardService = flashcardService;
        this.jwtService = jwtService;
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTodayCards(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            List<Map<String, Object>> cards = flashcardService.getTodayCards(userId);
            return ResponseEntity.ok(ApiResponse.ok(cards));
        } catch (Exception e) {
            log.error("Error getting today's cards: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load cards"));
        }
    }

    @PostMapping("/review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reviewCard(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            Object vocabIdObj = body.get("vocabularyId");
            String rating = (String) body.get("rating");

            if (vocabIdObj == null || rating == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("vocabularyId and rating are required"));
            }

            Long vocabularyId = vocabIdObj instanceof Number
                    ? ((Number) vocabIdObj).longValue()
                    : Long.parseLong(vocabIdObj.toString());

            Map<String, Object> result = flashcardService.reviewCard(userId, vocabularyId, rating);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Error reviewing card: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to review card"));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            Map<String, Object> stats = flashcardService.getFlashcardStats(userId);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (Exception e) {
            log.error("Error getting flashcard stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load stats"));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllCards(HttpServletRequest request) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            List<Map<String, Object>> cards = flashcardService.getAllCards(userId);
            return ResponseEntity.ok(ApiResponse.ok(cards));
        } catch (Exception e) {
            log.error("Error getting all cards: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load cards"));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addCard(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            String word = (String) body.get("word");
            String translation = (String) body.get("translation");
            String pronunciation = (String) body.get("pronunciation");
            String level = (String) body.get("level");

            if (word == null || translation == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("word and translation are required"));
            }

            Map<String, Object> card = flashcardService.addNewWord(userId, word, translation, pronunciation, level);
            return ResponseEntity.ok(ApiResponse.ok(card));
        } catch (Exception e) {
            log.error("Error adding card: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to add card"));
        }
    }

    @DeleteMapping("/{vocabularyId}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(
            @PathVariable Long vocabularyId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            boolean deleted = flashcardService.deleteCard(userId, vocabularyId);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.ok("Card deleted", null));
            } else {
                return ResponseEntity.status(404).body(ApiResponse.error("Card not found"));
            }
        } catch (Exception e) {
            log.error("Error deleting card: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to delete card"));
        }
    }
}
