package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_completion_settings")
public class LessonCompletionSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long lessonId;

    private boolean requireContentView = true;
    private boolean requireExercises = true;
    private boolean requireMiniTest = true;
    private int minTestScore = 60;
    private int minExerciseScore = 0;
    private boolean autoUnlockNext = true;

    @Column(columnDefinition = "TEXT")
    private String completionMessage;

    @Column(columnDefinition = "TEXT")
    private String certificateTemplate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LessonCompletionSettings() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public boolean isRequireContentView() { return requireContentView; }
    public void setRequireContentView(boolean requireContentView) { this.requireContentView = requireContentView; }
    public boolean isRequireExercises() { return requireExercises; }
    public void setRequireExercises(boolean requireExercises) { this.requireExercises = requireExercises; }
    public boolean isRequireMiniTest() { return requireMiniTest; }
    public void setRequireMiniTest(boolean requireMiniTest) { this.requireMiniTest = requireMiniTest; }
    public int getMinTestScore() { return minTestScore; }
    public void setMinTestScore(int minTestScore) { this.minTestScore = minTestScore; }
    public int getMinExerciseScore() { return minExerciseScore; }
    public void setMinExerciseScore(int minExerciseScore) { this.minExerciseScore = minExerciseScore; }
    public boolean isAutoUnlockNext() { return autoUnlockNext; }
    public void setAutoUnlockNext(boolean autoUnlockNext) { this.autoUnlockNext = autoUnlockNext; }
    public String getCompletionMessage() { return completionMessage; }
    public void setCompletionMessage(String completionMessage) { this.completionMessage = completionMessage; }
    public String getCertificateTemplate() { return certificateTemplate; }
    public void setCertificateTemplate(String certificateTemplate) { this.certificateTemplate = certificateTemplate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
