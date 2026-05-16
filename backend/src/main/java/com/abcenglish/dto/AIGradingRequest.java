package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class AIGradingRequest {
    private Long sessionId;
    private Long resultId;
    private String questionType;
    private String question;
    private String userAnswer;
    private String correctAnswer;
    private Double maxScore;
    private Map<String, Object> additionalContext;

    private List<Map<String, Object>> writingSamples;
    private Map<String, Object> speakingAnalysis;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getResultId() { return resultId; }
    public void setResultId(Long resultId) { this.resultId = resultId; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }
    public Map<String, Object> getAdditionalContext() { return additionalContext; }
    public void setAdditionalContext(Map<String, Object> additionalContext) { this.additionalContext = additionalContext; }
    public List<Map<String, Object>> getWritingSamples() { return writingSamples; }
    public void setWritingSamples(List<Map<String, Object>> writingSamples) { this.writingSamples = writingSamples; }
    public Map<String, Object> getSpeakingAnalysis() { return speakingAnalysis; }
    public void setSpeakingAnalysis(Map<String, Object> speakingAnalysis) { this.speakingAnalysis = speakingAnalysis; }
}
