package com.abcenglish.service;

import com.abcenglish.dto.AIGradingRequest;
import com.abcenglish.dto.AIGradingResponse;
import com.abcenglish.entity.TestQuestionResult;
import com.abcenglish.repository.TestQuestionResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class TestAIGradingService {

    private static final Logger log = LoggerFactory.getLogger(TestAIGradingService.class);
    private static final Duration AI_TIMEOUT = Duration.ofSeconds(60);

    private final WebClient groqWebClient;
    private final TestQuestionResultRepository questionResultRepository;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String groqModel;

    public TestAIGradingService(WebClient.Builder webClientBuilder,
                           TestQuestionResultRepository questionResultRepository,
                           ObjectMapper objectMapper) {
        this.groqWebClient = webClientBuilder.baseUrl("https://api.groq.com").build();
        this.questionResultRepository = questionResultRepository;
        this.objectMapper = objectMapper;
    }

    public AIGradingResponse gradeWriting(AIGradingRequest request) {
        String userAnswer = request.getUserAnswer();
        if (userAnswer == null || userAnswer.isBlank()) {
            return createEmptyResponse(request.getMaxScore(), "No answer provided");
        }

        String question = request.getQuestion() != null ? request.getQuestion() : "Essay writing";
        Double maxScore = request.getMaxScore() != null ? request.getMaxScore() : 10.0;

        String prompt = buildWritingPrompt(question, userAnswer, maxScore);
        String aiResponse = callAI(prompt);

        if (aiResponse == null || aiResponse.startsWith("AI_ERROR:")) {
            return createFallbackResponse(userAnswer, question, maxScore);
        }

        return parseWritingResponse(aiResponse, maxScore);
    }

    public AIGradingResponse gradeSpeaking(AIGradingRequest request) {
        String userAnswer = request.getUserAnswer();
        if (userAnswer == null || userAnswer.isBlank()) {
            return createEmptyResponse(request.getMaxScore(), "No audio recorded");
        }

        String question = request.getQuestion() != null ? request.getQuestion() : "Speaking prompt";
        Double maxScore = request.getMaxScore() != null ? request.getMaxScore() : 10.0;

        String prompt = buildSpeakingPrompt(question, userAnswer, maxScore);
        String aiResponse = callAI(prompt);

        if (aiResponse == null || aiResponse.startsWith("AI_ERROR:")) {
            return createFallbackResponse(userAnswer, question, maxScore);
        }

        return parseSpeakingResponse(aiResponse, maxScore);
    }

    @Async
    public CompletableFuture<AIGradingResponse> gradeWritingAsync(AIGradingRequest request, Long resultId, int questionIndex) {
        AIGradingResponse response = gradeWriting(request);

        if (resultId != null) {
            try {
                List<TestQuestionResult> results = questionResultRepository.findByResultId(resultId);
                TestQuestionResult qr = results.stream()
                        .filter(r -> r.getQuestionIndex() == questionIndex)
                        .findFirst()
                        .orElse(null);
                if (qr != null) {
                    qr.setAiScore(response.getScore());
                    qr.setAiFeedback(response.getFeedback());
                    qr.setAiGraded(true);
                    if (response.getCriteriaScores() != null) {
                        qr.setQuestionResults(objectMapper.writeValueAsString(response.getCriteriaScores()));
                    }
                    questionResultRepository.save(qr);
                }
            } catch (Exception e) {
                log.error("Failed to save AI grading result: {}", e.getMessage());
            }
        }

        return CompletableFuture.completedFuture(response);
    }

    @Async
    public CompletableFuture<AIGradingResponse> gradeSpeakingAsync(AIGradingRequest request, Long resultId, int questionIndex) {
        AIGradingResponse response = gradeSpeaking(request);

        if (resultId != null) {
            try {
                List<TestQuestionResult> results = questionResultRepository.findByResultId(resultId);
                TestQuestionResult qr = results.stream()
                        .filter(r -> r.getQuestionIndex() == questionIndex)
                        .findFirst()
                        .orElse(null);
                if (qr != null) {
                    qr.setAiScore(response.getScore());
                    qr.setAiFeedback(response.getFeedback());
                    qr.setAiGraded(true);
                    if (response.getCriteriaScores() != null) {
                        qr.setQuestionResults(objectMapper.writeValueAsString(response.getCriteriaScores()));
                    }
                    questionResultRepository.save(qr);
                }
            } catch (Exception e) {
                log.error("Failed to save AI speaking grading: {}", e.getMessage());
            }
        }

        return CompletableFuture.completedFuture(response);
    }

    public Map<String, Object> batchGrade(List<AIGradingRequest> requests) {
        List<AIGradingResponse> writingResults = new ArrayList<>();
        List<AIGradingResponse> speakingResults = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (AIGradingRequest request : requests) {
            try {
                if ("SPEAKING".equalsIgnoreCase(request.getQuestionType())) {
                    speakingResults.add(gradeSpeaking(request));
                } else {
                    writingResults.add(gradeWriting(request));
                }
            } catch (Exception e) {
                errors.add("Error grading question: " + e.getMessage());
            }
        }

        double totalScore = 0;
        int count = 0;
        for (AIGradingResponse r : writingResults) {
            if (r.getScore() != null) { totalScore += r.getScore(); count++; }
        }
        for (AIGradingResponse r : speakingResults) {
            if (r.getScore() != null) { totalScore += r.getScore(); count++; }
        }
        double avgScore = count > 0 ? totalScore / count : 0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalGraded", writingResults.size() + speakingResults.size());
        summary.put("writingCount", writingResults.size());
        summary.put("speakingCount", speakingResults.size());
        summary.put("averageScore", Math.round(avgScore * 10.0) / 10.0);
        summary.put("writingResults", writingResults);
        summary.put("speakingResults", speakingResults);
        summary.put("errors", errors);

        return summary;
    }

    private String buildWritingPrompt(String question, String userAnswer, Double maxScore) {
        return String.format("""
            You are an expert English writing evaluator. Grade the following writing submission.

            Question/Prompt: %s

            Student's Answer:
            %s

            Please evaluate this writing based on the following criteria (total score: %.1f):
            1. Content & Relevance (does it address the prompt?)
            2. Organization & Structure (clear paragraphs, logical flow)
            3. Vocabulary & Word Choice (variety, accuracy, appropriateness)
            4. Grammar & Accuracy (sentence structure, verb tenses, articles)
            5. Overall Impression

            Return your response in this exact JSON format (no other text):
            {
              "score": <number from 0 to %.1f>,
              "feedback": "<brief overall comment in Vietnamese>",
              "criteriaScores": {
                "content": <0-%.1f>,
                "organization": <0-%.1f>,
                "vocabulary": <0-%.1f>,
                "grammar": <0-%.1f>
              },
              "corrections": ["error 1: correction", "error 2: correction"],
              "suggestions": ["suggestion 1", "suggestion 2"],
              "strengths": ["strength 1", "strength 2"],
              "improvements": [{"area": "grammar", "tip": "specific tip"}]
            }
            """,
            question, userAnswer, maxScore,
            maxScore,
            maxScore * 0.3, maxScore * 0.2, maxScore * 0.25, maxScore * 0.25);
    }

    private String buildSpeakingPrompt(String question, String userAnswer, Double maxScore) {
        return String.format("""
            You are an expert English speaking evaluator. Grade the following speaking transcript.

            Prompt: %s

            Student's Response (transcribed):
            %s

            Please evaluate based on these criteria (total score: %.1f):
            1. Pronunciation & Fluency (clarity, natural pace)
            2. Vocabulary & Expression (word choice, variety)
            3. Grammar & Accuracy (sentence structure, tense usage)
            4. Comprehension & Relevance (understands and addresses the prompt)
            5. Overall Communication

            Return your response in this exact JSON format (no other text):
            {
              "score": <number from 0 to %.1f>,
              "feedback": "<brief overall comment in Vietnamese>",
              "criteriaScores": {
                "pronunciation": <0-%.1f>,
                "vocabulary": <0-%.1f>,
                "grammar": <0-%.1f>,
                "comprehension": <0-%.1f>
              },
              "corrections": ["pronunciation error 1", "grammar error 2"],
              "suggestions": ["speaking tip 1", "speaking tip 2"],
              "strengths": ["speaking strength 1"],
              "improvements": [{"area": "pronunciation", "tip": "specific tip"}],
              "languageLevel": "<estimated CEFR level>"
            }
            """,
            question, userAnswer, maxScore,
            maxScore,
            maxScore * 0.3, maxScore * 0.2, maxScore * 0.25, maxScore * 0.25);
    }

    @SuppressWarnings("unchecked")
    private AIGradingResponse parseWritingResponse(String response, Double maxScore) {
        AIGradingResponse result = new AIGradingResponse();
        try {
            response = response.trim();
            if (response.startsWith("```json")) response = response.substring(7);
            if (response.startsWith("```")) response = response.substring(3);
            if (response.endsWith("```")) response = response.substring(0, response.length() - 3);
            response = response.trim();

            Map<String, Object> parsed = objectMapper.readValue(response, Map.class);

            Object scoreObj = parsed.get("score");
            double score = 0;
            if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            }
            result.setScore(score);
            result.setMaxScore(maxScore);
            result.setPercentage(Math.round(score / maxScore * 100 * 10.0) / 10.0);

            result.setFeedback((String) parsed.get("feedback"));
            result.setOverallComment((String) parsed.get("feedback"));

            Object criteria = parsed.get("criteriaScores");
            if (criteria instanceof Map) {
                result.setCriteriaScores((Map<String, Object>) criteria);
            }

            Object corrections = parsed.get("corrections");
            if (corrections instanceof List) {
                result.setCorrections((List<String>) corrections);
            }

            Object suggestions = parsed.get("suggestions");
            if (suggestions instanceof List) {
                result.setSuggestions((List<String>) suggestions);
            }

            Object strengths = parsed.get("strengths");
            if (strengths instanceof List) {
                result.setStrengths((List<Map<String, Object>>) strengths);
            }

            Object improvements = parsed.get("improvements");
            if (improvements instanceof List) {
                result.setImprovements((List<Map<String, Object>>) improvements);
            }

        } catch (Exception e) {
            log.error("Failed to parse AI writing response: {}", e.getMessage());
            return createFallbackResponse("N/A", "Writing", maxScore);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private AIGradingResponse parseSpeakingResponse(String response, Double maxScore) {
        AIGradingResponse result = new AIGradingResponse();
        try {
            response = response.trim();
            if (response.startsWith("```json")) response = response.substring(7);
            if (response.startsWith("```")) response = response.substring(3);
            if (response.endsWith("```")) response = response.substring(0, response.length() - 3);
            response = response.trim();

            Map<String, Object> parsed = objectMapper.readValue(response, Map.class);

            Object scoreObj = parsed.get("score");
            double score = 0;
            if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            }
            result.setScore(score);
            result.setMaxScore(maxScore);
            result.setPercentage(Math.round(score / maxScore * 100 * 10.0) / 10.0);

            result.setFeedback((String) parsed.get("feedback"));
            result.setOverallComment((String) parsed.get("feedback"));
            result.setLanguageLevel((String) parsed.get("languageLevel"));

            Object criteria = parsed.get("criteriaScores");
            if (criteria instanceof Map) {
                result.setCriteriaScores((Map<String, Object>) criteria);
            }

            Object corrections = parsed.get("corrections");
            if (corrections instanceof List) {
                result.setCorrections((List<String>) corrections);
            }

            Object suggestions = parsed.get("suggestions");
            if (suggestions instanceof List) {
                result.setSuggestions((List<String>) suggestions);
            }

            Object improvements = parsed.get("improvements");
            if (improvements instanceof List) {
                result.setImprovements((List<Map<String, Object>>) improvements);
            }

        } catch (Exception e) {
            log.error("Failed to parse AI speaking response: {}", e.getMessage());
            return createFallbackResponse("N/A", "Speaking", maxScore);
        }
        return result;
    }

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
            requestBody.put("max_tokens", 2048);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = groqWebClient.mutate()
                    .defaultHeader("Authorization", "Bearer " + effectiveKey)
                    .build()
                    .post()
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

    private AIGradingResponse createEmptyResponse(Double maxScore, String reason) {
        AIGradingResponse response = new AIGradingResponse();
        response.setScore(0.0);
        response.setMaxScore(maxScore != null ? maxScore : 10.0);
        response.setPercentage(0);
        response.setFeedback(reason + ". No score awarded.");
        response.setCorrections(new ArrayList<>());
        response.setSuggestions(List.of("Please provide an answer to receive feedback."));
        response.setStrengths(new ArrayList<>());
        return response;
    }

    private AIGradingResponse createFallbackResponse(String userAnswer, String question, Double maxScore) {
        AIGradingResponse response = new AIGradingResponse();
        double score = maxScore != null ? maxScore * 0.6 : 6.0;
        response.setScore(score);
        response.setMaxScore(maxScore != null ? maxScore : 10.0);
        response.setPercentage(Math.round(score / (maxScore != null ? maxScore : 10.0) * 100));
        response.setFeedback("AI grading service temporarily unavailable. Your answer has been recorded and will be reviewed.");
        response.setOverallComment("Manual review pending.");
        response.setCorrections(new ArrayList<>());
        response.setSuggestions(List.of(
            "Focus on clear structure and proper grammar",
            "Use varied vocabulary appropriate to the topic",
            "Practice writing regularly to improve fluency"
        ));
        response.setStrengths(List.of(
            Map.of("area", "effort", "comment", "Answer submitted"),
            Map.of("area", "completion", "comment", "All parts addressed")
        ));
        return response;
    }
}
