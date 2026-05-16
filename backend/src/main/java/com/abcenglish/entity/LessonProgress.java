package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress")
public class LessonProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long lessonId;
    private Long courseId;

    private boolean contentViewed = false;
    private boolean exercisesCompleted = false;
    private boolean testCompleted = false;
    private boolean lessonCompleted = false;

    private int contentScore = 0;
    private int exerciseScore = 0;
    private int testScore = 0;
    private int totalScore = 0;

    private int timeSpentSeconds = 0;
    private int exerciseTimeSpentSeconds = 0;
    private int testTimeSpentSeconds = 0;

    private String completedSections;

    private LocalDateTime contentViewedAt;
    private LocalDateTime exercisesCompletedAt;
    private LocalDateTime testCompletedAt;
    private LocalDateTime lessonCompletedAt;
    private LocalDateTime lastAccessedAt;

    public LessonProgress() {}

    @PrePersist
    protected void onCreate() { lastAccessedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { lastAccessedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public boolean isContentViewed() { return contentViewed; }
    public void setContentViewed(boolean contentViewed) { this.contentViewed = contentViewed; }
    public boolean isExercisesCompleted() { return exercisesCompleted; }
    public void setExercisesCompleted(boolean exercisesCompleted) { this.exercisesCompleted = exercisesCompleted; }
    public boolean isTestCompleted() { return testCompleted; }
    public void setTestCompleted(boolean testCompleted) { this.testCompleted = testCompleted; }
    public boolean isLessonCompleted() { return lessonCompleted; }
    public void setLessonCompleted(boolean lessonCompleted) { this.lessonCompleted = lessonCompleted; }
    public int getContentScore() { return contentScore; }
    public void setContentScore(int contentScore) { this.contentScore = contentScore; }
    public int getExerciseScore() { return exerciseScore; }
    public void setExerciseScore(int exerciseScore) { this.exerciseScore = exerciseScore; }
    public int getTestScore() { return testScore; }
    public void setTestScore(int testScore) { this.testScore = testScore; }
    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int totalScore) { this.totalScore = totalScore; }
    public int getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(int timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public int getExerciseTimeSpentSeconds() { return exerciseTimeSpentSeconds; }
    public void setExerciseTimeSpentSeconds(int exerciseTimeSpentSeconds) { this.exerciseTimeSpentSeconds = exerciseTimeSpentSeconds; }
    public int getTestTimeSpentSeconds() { return testTimeSpentSeconds; }
    public void setTestTimeSpentSeconds(int testTimeSpentSeconds) { this.testTimeSpentSeconds = testTimeSpentSeconds; }
    public String getCompletedSections() { return completedSections; }
    public void setCompletedSections(String completedSections) { this.completedSections = completedSections; }
    public LocalDateTime getContentViewedAt() { return contentViewedAt; }
    public void setContentViewedAt(LocalDateTime contentViewedAt) { this.contentViewedAt = contentViewedAt; }
    public LocalDateTime getExercisesCompletedAt() { return exercisesCompletedAt; }
    public void setExercisesCompletedAt(LocalDateTime exercisesCompletedAt) { this.exercisesCompletedAt = exercisesCompletedAt; }
    public LocalDateTime getTestCompletedAt() { return testCompletedAt; }
    public void setTestCompletedAt(LocalDateTime testCompletedAt) { this.testCompletedAt = testCompletedAt; }
    public LocalDateTime getLessonCompletedAt() { return lessonCompletedAt; }
    public void setLessonCompletedAt(LocalDateTime lessonCompletedAt) { this.lessonCompletedAt = lessonCompletedAt; }
    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }
}
