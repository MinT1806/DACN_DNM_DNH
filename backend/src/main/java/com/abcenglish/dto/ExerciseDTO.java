package com.abcenglish.dto;

import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.ExerciseQuestion;
import java.util.List;

public class ExerciseDTO {
    private Long id;
    private String title;
    private String description;
    private String skill;
    private String level;
    private String topic;
    private String category;
    private String content;
    private String instructions;
    private String answerKey;
    private String explanation;
    private int duration;
    private int maxScore;
    private List<QuestionDTO> questions;
    private int questionsCount;
    private boolean completed;
    private double userScore;

    public ExerciseDTO() {}

    public ExerciseDTO(Exercise e) {
        this.id = e.getId();
        this.title = e.getTitle();
        this.description = e.getDescription();
        this.skill = e.getType() != null ? e.getType().name() : null;
        this.level = e.getLevel() != null ? e.getLevel().name() : null;
        this.topic = e.getTopic();
        this.category = e.getCategory();
        this.content = e.getContent();
        this.instructions = e.getInstructions();
        this.answerKey = e.getAnswerKey();
        this.explanation = e.getExplanation();
        this.duration = e.getDurationMinutes();
        this.maxScore = e.getMaxScore();
        this.questionsCount = 0;
    }

    public static class QuestionDTO {
        private Long id;
        private String question;
        private String type;
        private String content;
        private List<String> options;
        private int points;

        public QuestionDTO() {}

        public QuestionDTO(ExerciseQuestion q) {
            this.id = q.getId();
            this.question = q.getQuestion();
            this.type = q.getType() != null ? q.getType().name() : null;
            this.content = q.getContent();
            this.points = q.getPoints();
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
        public int getPoints() { return points; }
        public void setPoints(int points) { this.points = points; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getAnswerKey() { return answerKey; }
    public void setAnswerKey(String answerKey) { this.answerKey = answerKey; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public List<QuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDTO> questions) { this.questions = questions; }
    public int getQuestionsCount() { return questionsCount; }
    public void setQuestionsCount(int questionsCount) { this.questionsCount = questionsCount; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public double getUserScore() { return userScore; }
    public void setUserScore(double userScore) { this.userScore = userScore; }
}
