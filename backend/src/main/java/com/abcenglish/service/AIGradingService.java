package com.abcenglish.service;

import com.abcenglish.entity.AIChatHistory;
import com.abcenglish.repository.AIChatHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class AIGradingService {

    private static final Logger log = LoggerFactory.getLogger(AIGradingService.class);
    private static final Duration AI_TIMEOUT = Duration.ofSeconds(30);

    private final AIChatHistoryRepository chatHistoryRepository;
    private final WebClient groqWebClient;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String groqModel;

    public static record GradingResult(
            Double score,
            String feedback,
            List<String> corrections,
            List<String> suggestions,
            List<String> strengths,
            Map<String, Object> criteriaScores,
            String overallComment,
            String errorType,
            String languageLevel,
            List<Map<String, Object>> details
    ) {
        public static GradingResult create(Double score, String feedback) {
            return new GradingResult(score, feedback, new ArrayList<>(), new ArrayList<>(),
                new ArrayList<>(), new HashMap<>(), "", "", "", new ArrayList<>());
        }
    }

    public AIGradingService(AIChatHistoryRepository chatHistoryRepository, WebClient.Builder webClientBuilder) {
        this.chatHistoryRepository = chatHistoryRepository;
        this.groqWebClient = webClientBuilder.baseUrl("https://api.groq.com")
                .defaultHeader("Authorization", "Bearer " + groqApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public GradingResult gradeEssay(String essay, String question, Object maxScore) {
        try {
            double max = maxScore instanceof Number ? ((Number) maxScore).doubleValue() : 10.0;

            String prompt = buildEssayGradingPrompt(essay, question, max);
            String response = callAI(prompt);

            if (response == null || response.startsWith("AI_ERROR:")) {
                return GradingResult.create(7.0, "AI grading unavailable. Response recorded.");
            }

            return parseGradingResponse(response, max);
        } catch (Exception e) {
            log.error("Error grading essay: {}", e.getMessage());
            return GradingResult.create(7.0, "Error grading essay. Response recorded.");
        }
    }

    public GradingResult gradeTranslation(String original, String translation, String expectedTranslation) {
        try {
            String prompt = buildTranslationGradingPrompt(original, translation, expectedTranslation);
            String response = callAI(prompt);

            if (response == null || response.startsWith("AI_ERROR:")) {
                return GradingResult.create(6.0, "AI grading unavailable. Manual review pending.");
            }

            return parseGradingResponse(response, 10.0);
        } catch (Exception e) {
            log.error("Error grading translation: {}", e.getMessage());
            return GradingResult.create(6.0, "Translation recorded. Manual review pending.");
        }
    }

    public GradingResult gradeSpeaking(String transcript, String prompt, Object maxScore) {
        try {
            double max = maxScore instanceof Number ? ((Number) maxScore).doubleValue() : 10.0;

            String aiPrompt = buildSpeakingGradingPrompt(transcript, prompt, max);
            String response = callAI(aiPrompt);

            if (response == null || response.startsWith("AI_ERROR:")) {
                return GradingResult.create(max * 0.7, "AI grading unavailable. Your response has been recorded.");
            }

            return parseGradingResponse(response, max);
        } catch (Exception e) {
            log.error("Error grading speaking: {}", e.getMessage());
            return GradingResult.create(7.0, "Speaking response recorded. Manual review pending.");
        }
    }

    public GradingResult gradeWriting(String text, String question, Object maxScore) {
        return gradeEssay(text, question, maxScore);
    }

    public String checkGrammar(String text) {
        try {
            String prompt = "Check the following English text for grammar errors. " +
                    "Return ONLY a JSON response in this exact format (no other text):\n" +
                    "{\n" +
                    "  \"corrected\": \"the corrected text\",\n" +
                    "  \"errors\": [\"error 1\", \"error 2\"],\n" +
                    "  \"explanation\": \"brief explanation\"\n" +
                    "}\n\n" +
                    "Text to check:\n" + text;

            String response = callAI(prompt);
            if (response == null || response.startsWith("AI_ERROR:")) {
                return "{\"corrected\": \"" + text.replace("\"", "\\\"") + "\", \"errors\": [], \"explanation\": \"Grammar check unavailable\"}";
            }
            return response;
        } catch (Exception e) {
            log.error("Error checking grammar: {}", e.getMessage());
            return "{\"corrected\": \"" + text.replace("\"", "\\\"") + "\", \"errors\": [], \"explanation\": \"Grammar check unavailable\"}";
        }
    }

    public String evaluateAnswer(String answer, String question) {
        try {
            String prompt = "Evaluate the following English answer for accuracy and completeness.\n\n" +
                    "Question: " + question + "\n\n" +
                    "Answer: " + answer + "\n\n" +
                    "Return ONLY a JSON response (no other text):\n" +
                    "{\n" +
                    "  \"score\": 0-10,\n" +
                    "  \"feedback\": \"brief feedback in Vietnamese\",\n" +
                    "  \"isCorrect\": true/false\n" +
                    "}";

            String response = callAI(prompt);
            if (response == null || response.startsWith("AI_ERROR:")) {
                return "{\"score\": 7, \"feedback\": \"AI unavailable. Answer recorded.\", \"isCorrect\": true}";
            }
            return response;
        } catch (Exception e) {
            log.error("Error evaluating answer: {}", e.getMessage());
            return "{\"score\": 7, \"feedback\": \"Answer recorded for review.\", \"isCorrect\": true}";
        }
    }

    private String buildEssayGradingPrompt(String essay, String question, double maxScore) {
        return String.format("""
            You are an expert English writing evaluator. Grade the following essay.

            Topic/Prompt: %s
            Essay: %s

            Evaluate on a scale of 0 to %.1f based on:
            1. Content & Relevance
            2. Organization & Structure
            3. Vocabulary & Word Choice
            4. Grammar & Accuracy

            Return ONLY a JSON response (no other text):
            {
              "score": <number 0-%.1f>,
              "feedback": "<brief feedback in Vietnamese>",
              "corrections": ["correction 1", "correction 2"],
              "suggestions": ["suggestion 1"],
              "strengths": ["strength 1"],
              "overallComment": "<summary>"
            }
            """, question, essay, maxScore, maxScore);
    }

    private String buildTranslationGradingPrompt(String original, String translation, String expected) {
        return String.format("""
            Evaluate this English translation:
            Original: %s
            Translation: %s
            Expected style: %s

            Return ONLY a JSON response:
            {
              "score": 0-10,
              "feedback": "feedback in Vietnamese",
              "corrections": [],
              "suggestions": []
            }
            """, original, translation, expected != null ? expected : "natural English");
    }

    private String buildSpeakingGradingPrompt(String transcript, String prompt, double maxScore) {
        return String.format("""
            Evaluate this spoken English response:

            Prompt: %s
            Response: %s

            Grade on 0-%.1f scale for:
            - Pronunciation/Fluency
            - Vocabulary
            - Grammar
            - Comprehension

            Return ONLY a JSON response:
            {
              "score": <0-%.1f>,
              "feedback": "feedback in Vietnamese",
              "corrections": [],
              "suggestions": [],
              "languageLevel": "A1-C2"
            }
            """, prompt, transcript, maxScore, maxScore);
    }

    @SuppressWarnings("unchecked")
    private GradingResult parseGradingResponse(String response, double maxScore) {
        try {
            response = response.trim();
            if (response.startsWith("```json")) response = response.substring(7);
            if (response.startsWith("```")) response = response.substring(3);
            if (response.endsWith("```")) response = response.substring(0, response.length() - 3);
            response = response.trim();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(response, Map.class);

            double score = 0.0;
            Object scoreObj = parsed.get("score");
            if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            }
            Double scoreVal = score;

            String feedback = (String) parsed.getOrDefault("feedback", "");
            String overallComment = (String) parsed.getOrDefault("overallComment", feedback);
            String languageLevel = (String) parsed.getOrDefault("languageLevel", "");
            String errorType = (String) parsed.getOrDefault("errorType", "");

            List<String> corrections = new ArrayList<>();
            Object correctionsObj = parsed.get("corrections");
            if (correctionsObj instanceof List) corrections = (List<String>) correctionsObj;

            List<String> suggestions = new ArrayList<>();
            Object suggestionsObj = parsed.get("suggestions");
            if (suggestionsObj instanceof List) suggestions = (List<String>) suggestionsObj;

            List<String> strengths = new ArrayList<>();
            Object strengthsObj = parsed.get("strengths");
            if (strengthsObj instanceof List) strengths = (List<String>) strengthsObj;

            Map<String, Object> criteriaScores = new HashMap<>();
            Object criteriaObj = parsed.get("criteriaScores");
            if (criteriaObj instanceof Map) criteriaScores = (Map<String, Object>) criteriaObj;

            return new GradingResult(scoreVal, feedback, corrections, suggestions, strengths,
                criteriaScores, overallComment, errorType, languageLevel, new ArrayList<>());

        } catch (Exception e) {
            log.error("Failed to parse grading response: {}", e.getMessage());
            return GradingResult.create(maxScore * 0.7, "Parse error. Response recorded.");
        }
    }

    private GradingResult createFallbackGradingResult(String text, double maxScore) {
        return GradingResult.create(maxScore * 0.7, "AI grading temporarily unavailable. Response recorded.");
    }

    @SuppressWarnings("unchecked")
    private String callAI(String prompt) {
        try {
            String effectiveKey = groqApiKey;
            if (effectiveKey == null || effectiveKey.isEmpty() ||
                effectiveKey.equals("your_groq_api_key_here")) {
                return "AI_ERROR: AI service not configured. Please set GROQ_API_KEY.";
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1024);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = groqWebClient.post()
                    .uri("/openai/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(AI_TIMEOUT)
                    .onErrorResume(e -> {
                        log.error("AI API error: {}", e.getMessage());
                        return Mono.error(new RuntimeException("AI service error: " + e.getMessage()));
                    })
                    .block();

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> choice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    return (String) message.get("content");
                }
            }
            return null;

        } catch (WebClientResponseException e) {
            log.error("Groq API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "AI_ERROR: " + e.getStatusCode() + " - " + e.getMessage();
        } catch (Exception e) {
            log.error("Error calling AI: {}", e.getMessage());
            return "AI_ERROR: " + e.getMessage();
        }
    }
}
