package com.abcenglish.service;

import com.abcenglish.entity.AIChatHistory;
import com.abcenglish.repository.AIChatHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.*;

@Service
@PropertySource(value = "file:./.env", ignoreResourceNotFound = true)
@PropertySource(value = "../.env", ignoreResourceNotFound = true)
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final Duration AI_TIMEOUT = Duration.ofSeconds(30);

    private final AIChatHistoryRepository chatHistoryRepository;
    private final WebClient groqWebClient;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String groqModel;

    public AIService(AIChatHistoryRepository chatHistoryRepository, WebClient.Builder webClientBuilder) {
        this.chatHistoryRepository = chatHistoryRepository;
        this.groqWebClient = webClientBuilder.baseUrl("https://api.groq.com")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    private String getEffectiveApiKey() {
        if (groqApiKey == null || groqApiKey.isEmpty() || groqApiKey.equals("your_groq_api_key_here")) {
            log.error("GROQ_API_KEY is not configured or has default value!");
            log.warn("Please set GROQ_API_KEY in .env file or application.properties");
        } else {
            log.info("GROQ_API_KEY is configured (length: {})", groqApiKey.length());
        }
        return groqApiKey;
    }

    private WebClient getConfiguredWebClient() {
        String key = getEffectiveApiKey();
        return groqWebClient.mutate()
                .defaultHeader("Authorization", "Bearer " + key)
                .build();
    }

    public String chat(String userMessage, Long userId) {
        try {
            String effectiveKey = getEffectiveApiKey();
            if (effectiveKey == null || effectiveKey.isEmpty() ||
                effectiveKey.equals("your_groq_api_key_here")) {
                return "AI Tutor chưa được cấu hình. Vui lòng đặt GROQ_API_KEY trong docker-compose.yml hoặc .env file. " +
                       "Bạn có thể lấy API key miễn phí tại https://console.groq.com/keys";
            }

            log.info("Using Groq API with model: {}", groqModel);

            // Build messages
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of(
                "role", "system",
                "content", "You are an AI English tutor. Help users learn English by explaining grammar, vocabulary, and conversation. " +
                          "Be friendly, patient, and encouraging. Respond in the same language as the user, but use English examples. " +
                          "Keep responses concise and educational."
            ));

            if (userId != null) {
                List<AIChatHistory> history = chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
                Collections.reverse(history);
                int count = 0;
                for (AIChatHistory chat : history) {
                    if (count >= 4) break;
                    messages.add(Map.of("role", "user", "content", chat.getUserMessage()));
                    String resp = chat.getAiResponse();
                    messages.add(Map.of("role", "assistant", "content", resp != null ? resp : ""));
                    count++;
                }
            }

            messages.add(Map.of("role", "user", "content", userMessage));

            // Build request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1024);

            log.info("Sending request to Groq API...");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = getConfiguredWebClient().post()
                    .uri("/openai/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(AI_TIMEOUT)
                    .onErrorResume(e -> {
                        log.error("AI API timeout or error: {}", e.getMessage());
                        return Mono.error(new RuntimeException("AI service unavailable: " + e.getMessage()));
                    })
                    .block();

            log.info("Received response from Groq API");

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> choice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    String aiResponse = (String) message.get("content");

                    AIChatHistory history = new AIChatHistory();
                    history.setUserId(userId);
                    history.setUserMessage(userMessage);
                    history.setAiResponse(aiResponse);
                    chatHistoryRepository.save(history);

                    return aiResponse;
                }
            }
            return "Xin lỗi, tôi không thể trả lời lúc này.";
        } catch (WebClientResponseException e) {
            log.error("Groq API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "Lỗi từ Groq API: " + e.getStatusCode() + " - " + e.getMessage();
        } catch (Exception e) {
            log.error("Error in AI chat: ", e);
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("401")) {
                return "Lỗi xác thực AI. Vui lòng kiểm tra GROQ_API_KEY trong cấu hình.";
            }
            if (errorMsg != null && errorMsg.contains("400")) {
                return "Lỗi cú pháp request. Vui lòng thử lại.";
            }
            if (errorMsg != null && errorMsg.contains("timeout")) {
                return "AI mất quá lâu để phản hồi. Vui lòng thử lại.";
            }
            return "Đã xảy ra lỗi: " + errorMsg;
        }
    }
}
