package com.abcenglish.dto;

public class AIChatRequest {
    private String message;
    private String conversationContext;

    public AIChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getConversationContext() { return conversationContext; }
    public void setConversationContext(String conversationContext) { this.conversationContext = conversationContext; }
}
