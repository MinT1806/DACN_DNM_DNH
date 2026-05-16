package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.AIGradingService;
import com.abcenglish.service.ForumService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/forum")
@CrossOrigin(origins = "*")
public class ForumController {

    private final ForumService forumService;
    private final AIGradingService aiGradingService;
    private final JwtService jwtService;

    public ForumController(ForumService forumService, AIGradingService aiGradingService, JwtService jwtService) {
        this.forumService = forumService;
        this.aiGradingService = aiGradingService;
        this.jwtService = jwtService;
    }

    // ─── GET /api/forum/posts ──────────────────────────────────────────────────────
    // Supports: sort (newest/popular/unsolved), tag filter, pagination
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPosts(
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String tag) {
        var result = forumService.getPostsWithTag(sort, page, size, tag);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ─── GET /api/forum/posts/search ─────────────────────────────────────────────
    @GetMapping("/posts/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (keyword == null || keyword.trim().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Keyword is required"));
        }
        var result = forumService.searchPosts(keyword.trim(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ─── GET /api/forum/tags ─────────────────────────────────────────────────────
    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPopularTags() {
        List<Map<String, Object>> tags = forumService.getPopularTags();
        return ResponseEntity.ok(ApiResponse.ok(tags));
    }

    // ─── GET /api/forum/posts/{id} ──────────────────────────────────────────────
    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPostById(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        var post = forumService.getPostById(id, userId);
        if (post == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    // ─── POST /api/forum/posts ───────────────────────────────────────────────────
    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPost(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Title is required"));
        }
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Content is required"));
        }
        String tags = body.get("tags") != null ? body.get("tags").toString() : null;
        var post = forumService.createPost(userId, title, content, tags);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "id", post.getId(),
            "title", post.getTitle(),
            "message", "Post created successfully"
        )));
    }

    // ─── PUT /api/forum/posts/{id} ──────────────────────────────────────────────
    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePost(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        String tags = body.get("tags") != null ? body.get("tags").toString() : null;
        var post = forumService.updatePost(id, userId, title, content, tags);
        if (post == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Post not found or unauthorized"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", post.getId())));
    }

    // ─── DELETE /api/forum/posts/{id} ───────────────────────────────────────────
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        boolean deleted = forumService.deletePost(id, userId);
        if (!deleted) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Post not found or unauthorized"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Post deleted", null));
    }

    // ─── POST /api/forum/posts/{id}/vote ─────────────────────────────────────────────
    // Body: { "voteType": "up" | "down" | "none" }
    // "none" removes vote
    @PostMapping("/posts/{id}/vote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> votePost(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String voteType = body.get("voteType") != null ? body.get("voteType").toString() : "up";
        var result = forumService.votePost(userId, id, voteType);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ─── GET /api/forum/posts/{id}/comments ────────────────────────────────────────
    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "score") String sort) {
        var comments = forumService.getComments(id, sort);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    // ─── POST /api/forum/posts/{id}/comments ──────────────────────────────────────
    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String content = (String) body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Content required"));
        }
        var comment = forumService.addComment(userId, id, content);
        if (comment == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Post not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", comment.getId())));
    }

    // ─── DELETE /api/forum/comments/{id} ─────────────────────────────────────────
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        boolean deleted = forumService.deleteComment(id, userId);
        if (!deleted) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Comment not found or unauthorized"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted", null));
    }

    // ─── POST /api/forum/comments/{id}/vote ──────────────────────────────────────
    @PostMapping("/comments/{id}/vote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> voteComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String voteType = body.get("voteType") != null ? body.get("voteType").toString() : "up";
        var result = forumService.voteComment(userId, id, voteType);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ─── POST /api/forum/posts/{postId}/accept/{commentId} ──────────────────────────
    @PostMapping("/posts/{postId}/accept/{commentId}")
    public ResponseEntity<ApiResponse<Void>> acceptAnswer(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        boolean ok = forumService.acceptAnswer(postId, commentId, userId);
        if (!ok) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot accept answer"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Answer accepted", null));
    }

    // ─── POST /api/forum/ai/check-grammar ─────────────────────────────────────────
    // AI grammar check for post/comment content
    @PostMapping("/ai/check-grammar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkGrammar(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String text = (String) body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Text is required"));
        }
        if (text.trim().split("\\s+").length < 3) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Text too short"));
        }
        try {
            String jsonResult = aiGradingService.checkGrammar(text);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("originalText", text);
            response.put("gradingResult", jsonResult);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Grammar check failed: " + e.getMessage()));
        }
    }

    // ─── POST /api/forum/ai/evaluate-answer ─────────────────────────────────────
    // AI evaluate a comment answer quality
    @PostMapping("/ai/evaluate-answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateAnswer(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String question = (String) body.get("question");
        String answer = (String) body.get("answer");
        if (question == null || question.isBlank() || answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Question and answer are required"));
        }
        try {
            String jsonResult = aiGradingService.evaluateAnswer(question, answer);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("question", question);
            response.put("answer", answer);
            response.put("gradingResult", jsonResult);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Evaluation failed: " + e.getMessage()));
        }
    }
}
