package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class TestSessionResponse {
    private Long sessionId;
    private Long testId;
    private String title;
    private String description;
    private String testType;
    private String level;
    private int totalDuration;
    private int totalQuestions;
    private boolean timed;
    private boolean hasSections;

    private List<Map<String, Object>> sections;
    private List<Map<String, Object>> questions;
    private Map<String, Object> questionMap;

    private Long startedAt;
    private Integer remainingSeconds;
    private String status;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public int getTotalDuration() { return totalDuration; }
    public void setTotalDuration(int totalDuration) { this.totalDuration = totalDuration; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public boolean isTimed() { return timed; }
    public void setTimed(boolean timed) { this.timed = timed; }
    public boolean isHasSections() { return hasSections; }
    public void setHasSections(boolean hasSections) { this.hasSections = hasSections; }
    public List<Map<String, Object>> getSections() { return sections; }
    public void setSections(List<Map<String, Object>> sections) { this.sections = sections; }
    public List<Map<String, Object>> getQuestions() { return questions; }
    public void setQuestions(List<Map<String, Object>> questions) { this.questions = questions; }
    public Map<String, Object> getQuestionMap() { return questionMap; }
    public void setQuestionMap(Map<String, Object> questionMap) { this.questionMap = questionMap; }
    public Long getStartedAt() { return startedAt; }
    public void setStartedAt(Long startedAt) { this.startedAt = startedAt; }
    public Integer getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(Integer remainingSeconds) { this.remainingSeconds = remainingSeconds; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
