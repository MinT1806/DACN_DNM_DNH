package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_sections")
public class TestSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long testId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    private SectionType type;

    private int orderIndex = 0;
    private int durationMinutes = 0;
    private int questionsCount = 0;
    private int maxScore = 0;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String content;

    private boolean required = true;
    private boolean shuffleQuestions = false;

    public TestSection() {}

    public enum SectionType {
        INFO, VOCABULARY, GRAMMAR, READING, LISTENING, WRITING, SPEAKING, MIXED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public SectionType getType() { return type; }
    public void setType(SectionType type) { this.type = type; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public int getQuestionsCount() { return questionsCount; }
    public void setQuestionsCount(int questionsCount) { this.questionsCount = questionsCount; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public boolean isShuffleQuestions() { return shuffleQuestions; }
    public void setShuffleQuestions(boolean shuffleQuestions) { this.shuffleQuestions = shuffleQuestions; }
}
