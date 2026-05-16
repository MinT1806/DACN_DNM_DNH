package com.abcenglish.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reset")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class ResetController {

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/all")
    @Transactional
    public ResponseEntity<Map<String, String>> resetAll() {
        try {
            // Delete in FK-safe order, using LIMIT batches to avoid long locks on remote DB
            deleteInBatches("ai_chat_history", 1000);
            deleteInBatches("user_story_progress", 1000);
            deleteInBatches("story_steps", 1000);
            deleteInBatches("stories", 1000);
            deleteInBatches("user_challenges", 1000);
            deleteInBatches("daily_challenges", 1000);
            deleteInBatches("user_badges", 1000);
            deleteInBatches("saved_words", 1000);
            deleteInBatches("forum_comments", 1000);
            deleteInBatches("forum_upvotes", 1000);
            deleteInBatches("forum_posts", 1000);
            deleteInBatches("test_results", 1000);
            deleteInBatches("test_sessions", 1000);
            deleteInBatches("exercise_submissions", 1000);
            deleteInBatches("exercise_questions", 1000);
            deleteInBatches("exercises", 1000);
            deleteInBatches("tests", 1000);
            deleteInBatches("quiz_results", 1000);
            deleteInBatches("user_progress", 1000);
            deleteInBatches("lessons", 1000);
            deleteInBatches("courses", 1000);
            deleteInBatches("vocabulary_words", 1000);
            deleteInBatches("users", 1000);

            Map<String, String> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "All data deleted. Restart the backend to re-seed with meaningful demo data.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    private void deleteInBatches(String table, int batchSize) {
        int deleted;
        do {
            deleted = entityManager.createNativeQuery(
                "DELETE FROM " + table + " WHERE id IN (SELECT id FROM " + table + " LIMIT " + batchSize + ")"
            ).executeUpdate();
        } while (deleted > 0);
    }
}
