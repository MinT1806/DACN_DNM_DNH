package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.dto.VocabDTO;
import com.abcenglish.service.VocabularyService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabulary")
@CrossOrigin(origins = "*")
public class VocabularyController {

    private final VocabularyService vocabularyService;
    private final JwtService jwtService;

    public VocabularyController(VocabularyService vocabularyService, JwtService jwtService) {
        this.vocabularyService = vocabularyService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<List<VocabDTO>> getAllVocabulary(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String category
    ) {
        if (level != null) {
            return ResponseEntity.ok(vocabularyService.getVocabularyByLevel(level));
        }
        if (category != null) {
            return ResponseEntity.ok(vocabularyService.getVocabularyByCategory(category));
        }
        return ResponseEntity.ok(vocabularyService.getAllVocabulary());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VocabDTO>> addVocabulary(
            @RequestBody VocabDTO dto,
            HttpServletRequest request
    ) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        // Đánh dấu là từ do user tự tạo
        dto.setCreatedBy(userId);
        VocabDTO saved = vocabularyService.addVocabulary(dto);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<VocabDTO>> updateVocabulary(
            @PathVariable Long id,
            @RequestBody VocabDTO dto,
            HttpServletRequest request
    ) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        VocabDTO updated = vocabularyService.updateVocabulary(id, dto);
        if (updated == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Vocabulary not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<VocabDTO>> patchVocabulary(
            @PathVariable Long id,
            @RequestBody VocabDTO dto,
            HttpServletRequest request
    ) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        VocabDTO updated = vocabularyService.patchVocabulary(id, dto, userId);
        if (updated == null) {
            return ResponseEntity.status(403).body(ApiResponse.error("You can only edit your own words"));
        }
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVocabulary(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        vocabularyService.deleteVocabulary(id);
        return ResponseEntity.ok(ApiResponse.ok("Vocabulary deleted", null));
    }

    @DeleteMapping("/my/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOwnVocabulary(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        boolean deleted = vocabularyService.deleteOwnVocabulary(id, userId);
        if (!deleted) {
            return ResponseEntity.status(403).body(ApiResponse.error("You can only delete your own words"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Vocabulary deleted", null));
    }
}
