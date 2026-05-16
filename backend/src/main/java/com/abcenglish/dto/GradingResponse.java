package com.abcenglish.dto;

public class GradingResponse {
    private Double score;
    private String feedback;
    private String suggestions;
    
    public GradingResponse() {}
    
    public GradingResponse(Double score, String feedback, String suggestions) {
        this.score = score;
        this.feedback = feedback;
        this.suggestions = suggestions;
    }
    
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }
}
