package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class TestStartRequest {
    private Long lessonId;
    private String sectionType;
    private Map<String, Object> preferences;

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getSectionType() { return sectionType; }
    public void setSectionType(String sectionType) { this.sectionType = sectionType; }
    public Map<String, Object> getPreferences() { return preferences; }
    public void setPreferences(Map<String, Object> preferences) { this.preferences = preferences; }
}
