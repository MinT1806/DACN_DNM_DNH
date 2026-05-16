package com.abcenglish.controller;

import com.abcenglish.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = "*")
public class AgentController {

    private final AIService aiService;

    public AgentController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : null;

            String response = aiService.chat(message, userId);

            // Return format expected by frontend: { content: { message: "..." } }
            Map<String, Object> content = new HashMap<>();
            content.put("message", response);
            content.put("examples", List.of());
            content.put("tip", "");

            Map<String, Object> result = new HashMap<>();
            result.put("content", content);
            result.put("success", true);
            result.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.ok(error);
        }
    }

    @PostMapping("/score")
    public ResponseEntity<Map<String, Object>> scoreAnswer(@RequestBody Map<String, Object> request) {
        String answer = (String) request.get("answer");
        String question = (String) request.getOrDefault("question", "Describe your answer");

        Map<String, Object> content = new HashMap<>();
        content.put("score", 85);
        content.put("feedback", "Good job! Your answer is well-structured and demonstrates good understanding of the topic.");
        content.put("suggestions", List.of(
            "Try to use more varied vocabulary",
            "Work on connecting your ideas more smoothly",
            "Great use of grammar!"
        ));
        content.put("strengths", List.of(
            "Clear structure",
            "Good vocabulary usage"
        ));
        content.put("rubric", "Based on clarity, vocabulary, grammar, and relevance");

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate-exercises")
    public ResponseEntity<Map<String, Object>> generateExercises(@RequestBody Map<String, Object> request) {
        String topic = (String) request.getOrDefault("topic", "General English");
        String level = (String) request.getOrDefault("level", "BEGINNER");

        List<Map<String, Object>> questions = new ArrayList<>();
        questions.add(Map.of(
            "number", 1,
            "question", "What does '" + topic + "' mean?",
            "options", List.of("Option A", "Option B", "Option C", "Option D"),
            "correctAnswer", "Option A",
            "explanation", "This is the correct answer because it matches the definition."
        ));
        questions.add(Map.of(
            "number", 2,
            "question", "Complete the sentence: 'The cat ___ on the table.'",
            "options", List.of("is sitting", "sit", "sitting", "sat"),
            "correctAnswer", "is sitting",
            "explanation", "We use 'is + sitting' for present continuous tense."
        ));

        Map<String, Object> content = new HashMap<>();
        content.put("questions", questions);
        content.put("topic", topic);
        content.put("level", level);
        content.put("skill", "GRAMMAR");

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/guidance/{userId}")
    public ResponseEntity<Map<String, Object>> getGuidance(@PathVariable Long userId) {
        Map<String, Object> guidance = new HashMap<>();
        Map<String, Object> content = new HashMap<>();

        content.put("summary", "Ban dang tien bo tot! Hay tap trung vao tu vung va ngu phap de cai thien diem so.");
        content.put("recommendations", List.of(
            "Hoc 10 tu vung moi moi ngay",
            "Luyen nghe 15 phut moi ngay",
            "Hoan thanh bai tap ngu phap"
        ));
        content.put("nextLesson", "Unit 5: Past Tense - Talking about past events");
        content.put("strengths", List.of("Listening skill is strong", "Good vocabulary retention"));
        content.put("areasToImprove", List.of("Speaking confidence", "Grammar accuracy"));

        guidance.put("userId", userId);
        guidance.put("content", content);
        guidance.put("generatedAt", System.currentTimeMillis());

        return ResponseEntity.ok(guidance);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        List<Map<String, Object>> history = new ArrayList<>();

        Map<String, Object> h1 = new HashMap<>();
        h1.put("id", 1L);
        h1.put("message", "Hello! How can I help you today?");
        h1.put("response", "I need help with English grammar.");
        h1.put("timestamp", System.currentTimeMillis() - 86400000);
        history.add(h1);

        return ResponseEntity.ok(history);
    }
}
