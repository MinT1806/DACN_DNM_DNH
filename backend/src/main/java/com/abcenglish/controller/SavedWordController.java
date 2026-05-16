package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.SavedWord;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.SavedWordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-words")
@CrossOrigin(origins = "*")
public class SavedWordController {

    private static final Logger log = LoggerFactory.getLogger(SavedWordController.class);

    private final SavedWordService savedWordService;
    private final JwtService jwtService;

    public SavedWordController(SavedWordService savedWordService, JwtService jwtService) {
        this.savedWordService = savedWordService;
        this.jwtService = jwtService;
    }

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            return jwtService.extractUserIdFromToken(authHeader.substring(7));
        } catch (Exception e) {
            log.warn("Failed to extract userId from token: {}", e.getMessage());
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedWord>>> getSavedWords(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            List<SavedWord> words = savedWordService.getSavedWords(userId);
            return ResponseEntity.ok(ApiResponse.ok(words));
        } catch (Exception e) {
            log.error("Error getting saved words", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to get saved words"));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavedWord>> saveWord(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            
            Object vocabIdObj = body.get("vocabularyId");
            if (vocabIdObj == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("vocabularyId is required"));
            }
            
            Long vocabularyId;
            if (vocabIdObj instanceof Integer) {
                vocabularyId = ((Integer) vocabIdObj).longValue();
            } else if (vocabIdObj instanceof Long) {
                vocabularyId = (Long) vocabIdObj;
            } else {
                vocabularyId = Long.parseLong(vocabIdObj.toString());
            }
            
            SavedWord saved = savedWordService.saveWord(userId, vocabularyId);
            if (saved == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Vocabulary not found"));
            }
            return ResponseEntity.ok(ApiResponse.ok("Word saved successfully", saved));
        } catch (Exception e) {
            log.error("Error saving word", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to save word"));
        }
    }

    @DeleteMapping("/{vocabularyId}")
    public ResponseEntity<ApiResponse<Void>> unSaveWord(
            @PathVariable Long vocabularyId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            
            boolean result = savedWordService.unSaveWord(userId, vocabularyId);
            if (result) {
                return ResponseEntity.ok(ApiResponse.ok("Word unsaved successfully", null));
            } else {
                return ResponseEntity.ok(ApiResponse.ok("Word was not in saved list", null));
            }
        } catch (Exception e) {
            log.error("Error unsaving word", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to unsave word"));
        }
    }

    @GetMapping("/flashcards")
    public ResponseEntity<ApiResponse<List<SavedWord>>> getFlashcardWords(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            List<SavedWord> words = savedWordService.getFlashcardWords(userId);
            return ResponseEntity.ok(ApiResponse.ok(words));
        } catch (Exception e) {
            log.error("Error getting flashcard words", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to get flashcard words"));
        }
    }

    @PostMapping("/flashcards/review")
    public ResponseEntity<ApiResponse<SavedWord>> markAsReviewed(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            
            Object vocabIdObj = body.get("vocabularyId");
            if (vocabIdObj == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("vocabularyId is required"));
            }
            
            Long vocabularyId;
            if (vocabIdObj instanceof Integer) {
                vocabularyId = ((Integer) vocabIdObj).longValue();
            } else if (vocabIdObj instanceof Long) {
                vocabularyId = (Long) vocabIdObj;
            } else {
                vocabularyId = Long.parseLong(vocabIdObj.toString());
            }
            
            Boolean correct = body.get("correct") != null ? (Boolean) body.get("correct") : false;
            
            SavedWord updated = savedWordService.markAsReviewed(userId, vocabularyId, correct);
            if (updated == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Saved word not found"));
            }
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (Exception e) {
            log.error("Error marking as reviewed", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to mark as reviewed"));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFlashcardStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = getUserIdFromToken(authHeader);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }
            Map<String, Object> stats = savedWordService.getFlashcardStats(userId);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (Exception e) {
            log.error("Error getting flashcard stats", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to get flashcard stats"));
        }
    }
}
