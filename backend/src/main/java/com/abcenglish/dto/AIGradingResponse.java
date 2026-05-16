package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class AIGradingResponse {
    private Double score;
    private Double maxScore;
    private double percentage;

    private String feedback;
    private String overallComment;

    private List<String> corrections;
    private List<String> suggestions;

    private Map<String, Object> criteriaScores;
    private Map<String, String> detailedFeedback;

    private List<Map<String, Object>> improvements;
    private List<Map<String, Object>> strengths;

    private String tone;
    private String errorType;
    private String languageLevel;

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }
    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getOverallComment() { return overallComment; }
    public void setOverallComment(String overallComment) { this.overallComment = overallComment; }
    public List<String> getCorrections() { return corrections; }
    public void setCorrections(List<String> corrections) { this.corrections = corrections; }
    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
    public Map<String, Object> getCriteriaScores() { return criteriaScores; }
    public void setCriteriaScores(Map<String, Object> criteriaScores) { this.criteriaScores = criteriaScores; }
    public Map<String, String> getDetailedFeedback() { return detailedFeedback; }
    public void setDetailedFeedback(Map<String, String> detailedFeedback) { this.detailedFeedback = detailedFeedback; }
    public List<Map<String, Object>> getImprovements() { return improvements; }
    public void setImprovements(List<Map<String, Object>> improvements) { this.improvements = improvements; }
    public List<Map<String, Object>> getStrengths() { return strengths; }
    public void setStrengths(List<Map<String, Object>> strengths) { this.strengths = strengths; }
    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }
    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }
    public String getLanguageLevel() { return languageLevel; }
    public void setLanguageLevel(String languageLevel) { this.languageLevel = languageLevel; }
}
