package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class TestResultResponse {
    private Long resultId;
    private Long sessionId;
    private Long testId;
    private String testTitle;
    private String testType;
    private String level;

    private double score;
    private double percentage;
    private boolean passed;
    private int passingScore;
    private int maxScore;

    private int correctAnswers;
    private int totalQuestions;
    private int timeSpentSeconds;
    private int xpEarned;

    private String feedback;
    private String overallFeedback;

    private List<Map<String, Object>> sectionResults;
    private List<Map<String, Object>> questionResults;
    private Map<String, Object> aiGradingSummary;

    private String completedAt;
    private String status;

    public Long getResultId() { return resultId; }
    public void setResultId(Long resultId) { this.resultId = resultId; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestTitle() { return testTitle; }
    public void setTestTitle(String testTitle) { this.testTitle = testTitle; }
    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public int getPassingScore() { return passingScore; }
    public void setPassingScore(int passingScore) { this.passingScore = passingScore; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(int timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public int getXpEarned() { return xpEarned; }
    public void setXpEarned(int xpEarned) { this.xpEarned = xpEarned; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getOverallFeedback() { return overallFeedback; }
    public void setOverallFeedback(String overallFeedback) { this.overallFeedback = overallFeedback; }
    public List<Map<String, Object>> getSectionResults() { return sectionResults; }
    public void setSectionResults(List<Map<String, Object>> sectionResults) { this.sectionResults = sectionResults; }
    public List<Map<String, Object>> getQuestionResults() { return questionResults; }
    public void setQuestionResults(List<Map<String, Object>> questionResults) { this.questionResults = questionResults; }
    public Map<String, Object> getAiGradingSummary() { return aiGradingSummary; }
    public void setAiGradingSummary(Map<String, Object> aiGradingSummary) { this.aiGradingSummary = aiGradingSummary; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
