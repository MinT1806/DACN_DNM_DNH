package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class TestSubmitRequest {
    private Map<String, Object> answers;
    private Long sessionId;
    private Long resultId;
    private String sectionType;
    private Integer timeSpentSeconds;
    private List<Map<String, Object>> sectionAnswers;
    private Map<String, String> audioAnswers;

    public Map<String, Object> getAnswers() { return answers; }
    public void setAnswers(Map<String, Object> answers) { this.answers = answers; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getResultId() { return resultId; }
    public void setResultId(Long resultId) { this.resultId = resultId; }
    public String getSectionType() { return sectionType; }
    public void setSectionType(String sectionType) { this.sectionType = sectionType; }
    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public List<Map<String, Object>> getSectionAnswers() { return sectionAnswers; }
    public void setSectionAnswers(List<Map<String, Object>> sectionAnswers) { this.sectionAnswers = sectionAnswers; }
    public Map<String, String> getAudioAnswers() { return audioAnswers; }
    public void setAudioAnswers(Map<String, String> audioAnswers) { this.audioAnswers = audioAnswers; }
}
