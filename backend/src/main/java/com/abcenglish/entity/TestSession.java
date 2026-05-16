package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_sessions")
public class TestSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long testId;

    private String testTitle;
    private String testType;
    private String level;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;
    private LocalDateTime expiredAt;

    private Integer totalTimeSeconds = 0;
    private Integer remainingSeconds = 0;
    private Integer sectionTimeSeconds = 0;
    private String currentSection = "INFO";

    private Integer questionsCount;
    private Integer answeredCount = 0;

    @Enumerated(EnumType.STRING)
    private TestStatus status = TestStatus.NOT_STARTED;

    @Column(columnDefinition = "TEXT")
    private String answersJson;

    @Column(columnDefinition = "TEXT")
    private String sectionProgressJson;

    private boolean timed = true;
    private boolean hasSections = false;
    private boolean autoSubmitted = false;

    public enum TestStatus {
        NOT_STARTED, IN_PROGRESS, SECTION_COMPLETED, SUBMITTED, TIMED_OUT, ABANDONED
    }

    public TestSession() {}

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
        if (status == null) status = TestStatus.NOT_STARTED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestTitle() { return testTitle; }
    public void setTestTitle(String testTitle) { this.testTitle = testTitle; }
    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getExpiredAt() { return expiredAt; }
    public void setExpiredAt(LocalDateTime expiredAt) { this.expiredAt = expiredAt; }
    public Integer getTotalTimeSeconds() { return totalTimeSeconds; }
    public void setTotalTimeSeconds(Integer totalTimeSeconds) { this.totalTimeSeconds = totalTimeSeconds; }
    public Integer getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(Integer remainingSeconds) { this.remainingSeconds = remainingSeconds; }
    public Integer getSectionTimeSeconds() { return sectionTimeSeconds; }
    public void setSectionTimeSeconds(Integer sectionTimeSeconds) { this.sectionTimeSeconds = sectionTimeSeconds; }
    public String getCurrentSection() { return currentSection; }
    public void setCurrentSection(String currentSection) { this.currentSection = currentSection; }
    public Integer getQuestionsCount() { return questionsCount; }
    public void setQuestionsCount(Integer questionsCount) { this.questionsCount = questionsCount; }
    public Integer getAnsweredCount() { return answeredCount; }
    public void setAnsweredCount(Integer answeredCount) { this.answeredCount = answeredCount; }
    public TestStatus getStatus() { return status; }
    public void setStatus(TestStatus status) { this.status = status; }
    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
    public String getSectionProgressJson() { return sectionProgressJson; }
    public void setSectionProgressJson(String sectionProgressJson) { this.sectionProgressJson = sectionProgressJson; }
    public boolean isTimed() { return timed; }
    public void setTimed(boolean timed) { this.timed = timed; }
    public boolean isHasSections() { return hasSections; }
    public void setHasSections(boolean hasSections) { this.hasSections = hasSections; }
    public boolean isAutoSubmitted() { return autoSubmitted; }
    public void setAutoSubmitted(boolean autoSubmitted) { this.autoSubmitted = autoSubmitted; }
}
