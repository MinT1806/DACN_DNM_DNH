package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_challenges")
public class DailyChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate challengeDate;

    @Enumerated(EnumType.STRING)
    private ChallengeType type;

    private String title;
    private String description;
    private int xpReward;
    private int targetGoal;
    private String difficulty;
    private boolean active = true;
    private LocalDateTime createdAt;

    public DailyChallenge() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (challengeDate == null) challengeDate = LocalDate.now();
    }

    public enum ChallengeType {
        VOCAB_QUIZ, LISTENING, GRAMMAR_SPRINT, SPEAKING_SHADOWING, READING_SPEED, MIXED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getChallengeDate() { return challengeDate; }
    public void setChallengeDate(LocalDate challengeDate) { this.challengeDate = challengeDate; }
    public ChallengeType getType() { return type; }
    public void setType(ChallengeType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getXpReward() { return xpReward; }
    public void setXpReward(int xpReward) { this.xpReward = xpReward; }
    public int getTargetGoal() { return targetGoal; }
    public void setTargetGoal(int targetGoal) { this.targetGoal = targetGoal; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
