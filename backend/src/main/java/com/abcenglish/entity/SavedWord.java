package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_words")
public class SavedWord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long vocabularyId;
    
    private String word;
    private String translation;
    private String pronunciation;
    private String level;
    
    @Column(nullable = false)
    private boolean learned = false;
    
    @Column(nullable = false)
    private int reviewCount = 0;
    
    @Column(nullable = false)
    private int correctCount = 0;
    
    private LocalDateTime savedAt;
    private LocalDateTime lastReviewedAt;

    private int intervalDays = 1;
    private LocalDate nextReviewDate;

    public SavedWord() {}
    
    @PrePersist
    protected void onCreate() {
        savedAt = LocalDateTime.now();
        lastReviewedAt = LocalDateTime.now();
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getVocabularyId() { return vocabularyId; }
    public void setVocabularyId(Long vocabularyId) { this.vocabularyId = vocabularyId; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }
    public String getPronunciation() { return pronunciation; }
    public void setPronunciation(String pronunciation) { this.pronunciation = pronunciation; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public boolean isLearned() { return learned; }
    public void setLearned(boolean learned) { this.learned = learned; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
    public LocalDateTime getSavedAt() { return savedAt; }
    public void setSavedAt(LocalDateTime savedAt) { this.savedAt = savedAt; }
    public LocalDateTime getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(LocalDateTime lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }
    public int getIntervalDays() { return intervalDays; }
    public void setIntervalDays(int intervalDays) { this.intervalDays = intervalDays; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate nextReviewDate) { this.nextReviewDate = nextReviewDate; }
}
