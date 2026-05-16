package com.abcenglish.controller;

import com.abcenglish.dto.AIChatRequest;
import com.abcenglish.dto.AIChatResponse;
import com.abcenglish.entity.AIChatHistory;
import com.abcenglish.repository.AIChatHistoryRepository;
import com.abcenglish.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private final AIService aiService;
    private final AIChatHistoryRepository chatHistoryRepository;

    public AIController(AIService aiService, AIChatHistoryRepository chatHistoryRepository) {
        this.aiService = aiService;
        this.chatHistoryRepository = chatHistoryRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
            @RequestBody AIChatRequest request,
            @RequestParam(required = false) Long userId
    ) {
        try {
            String response = aiService.chat(request.getMessage(), userId);
            return ResponseEntity.ok(new AIChatResponse(response, true));
        } catch (Exception e) {
            AIChatResponse errorResponse = new AIChatResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError(e.getMessage());
            return ResponseEntity.ok(errorResponse);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<AIChatHistory>> getChatHistory(@RequestParam Long userId) {
        return ResponseEntity.ok(chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }
}
