package com.abcenglish.dto;

public class AIChatResponse {
    private String response;
    private String conversationId;
    private boolean success;
    private String error;

    public AIChatResponse() {}

    public AIChatResponse(String response, boolean success) {
        this.response = response;
        this.success = success;
    }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
