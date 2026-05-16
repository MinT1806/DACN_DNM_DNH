package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class AIExerciseResponse {
    private boolean success;
    private String message;
    private AIExerciseData data;

    public AIExerciseResponse() {}

    public AIExerciseResponse(boolean success, String message, AIExerciseData data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static AIExerciseResponse ok(AIExerciseData data) {
        return new AIExerciseResponse(true, null, data);
    }

    public static AIExerciseResponse error(String message) {
        return new AIExerciseResponse(false, message, null);
    }

    public static AIExerciseResponse success(String message, AIExerciseData data) {
        return new AIExerciseResponse(true, message, data);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public AIExerciseData getData() { return data; }
    public void setData(AIExerciseData data) { this.data = data; }

    public static class AIExerciseData {
        private Long exerciseId;
        private String title;
        private String skill;
        private String topic;
        private String level;
        private List<Map<String, Object>> questions;
        private Integer questionCount;
        private Integer durationMinutes;
        private GradingResult grading;
        private String transcript;
        private List<Map<String, Object>> savedResults;

        public Long getExerciseId() { return exerciseId; }
        public void setExerciseId(Long exerciseId) { this.exerciseId = exerciseId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSkill() { return skill; }
        public void setSkill(String skill) { this.skill = skill; }
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public List<Map<String, Object>> getQuestions() { return questions; }
        public void setQuestions(List<Map<String, Object>> questions) { this.questions = questions; }
        public Integer getQuestionCount() { return questionCount; }
        public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
        public Integer getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public GradingResult getGrading() { return grading; }
        public void setGrading(GradingResult grading) { this.grading = grading; }
        public String getTranscript() { return transcript; }
        public void setTranscript(String transcript) { this.transcript = transcript; }
        public List<Map<String, Object>> getSavedResults() { return savedResults; }
        public void setSavedResults(List<Map<String, Object>> savedResults) { this.savedResults = savedResults; }
    }

    public static class GradingResult {
        private Double score;
        private String feedback;
        private List<String> suggestions;
        private List<Map<String, Object>> details;
        private String transcript;
        private Integer correctCount;
        private Integer totalCount;
        private List<Map<String, Object>> questionResults;
        private Double xpEarned;
        private String overallFeedback;

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
        public List<String> getSuggestions() { return suggestions; }
        public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
        public List<Map<String, Object>> getDetails() { return details; }
        public void setDetails(List<Map<String, Object>> details) { this.details = details; }
        public String getTranscript() { return transcript; }
        public void setTranscript(String transcript) { this.transcript = transcript; }
        public Integer getCorrectCount() { return correctCount; }
        public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }
        public Integer getTotalCount() { return totalCount; }
        public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }
        public List<Map<String, Object>> getQuestionResults() { return questionResults; }
        public void setQuestionResults(List<Map<String, Object>> questionResults) { this.questionResults = questionResults; }
        public Double getXpEarned() { return xpEarned; }
        public void setXpEarned(Double xpEarned) { this.xpEarned = xpEarned; }
        public String getOverallFeedback() { return overallFeedback; }
        public void setOverallFeedback(String overallFeedback) { this.overallFeedback = overallFeedback; }
    }
}
