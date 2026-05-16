package com.abcenglish.dto;

import com.abcenglish.entity.VocabularyWord;
import java.time.LocalDateTime;

public class VocabDTO {
    private Long id;
    private String word;
    private String pronunciation;
    private String translation;
    private String definition;
    private String example;
    private String exampleTranslation;
    private String level;
    private String category;
    private String audioUrl;
    private String imageUrl;
    private int timesReviewed;
    private int timesCorrect;
    private LocalDateTime createdAt;
    private Long createdBy;

    public VocabDTO() {}

    public static VocabDTO fromEntity(VocabularyWord w) {
        VocabDTO dto = new VocabDTO();
        dto.setId(w.getId());
        dto.setWord(w.getWord());
        dto.setPronunciation(w.getPronunciation());
        dto.setTranslation(w.getTranslation());
        dto.setDefinition(w.getDefinition());
        dto.setExample(w.getExample());
        dto.setExampleTranslation(w.getExampleTranslation());
        dto.setLevel(w.getLevel() != null ? w.getLevel().name() : null);
        dto.setCategory(w.getCategory());
        dto.setAudioUrl(w.getAudioUrl());
        dto.setImageUrl(w.getImageUrl());
        dto.setTimesReviewed(w.getTimesReviewed());
        dto.setTimesCorrect(w.getTimesCorrect());
        dto.setCreatedAt(w.getCreatedAt());
        dto.setCreatedBy(w.getCreatedBy());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public String getPronunciation() { return pronunciation; }
    public void setPronunciation(String pronunciation) { this.pronunciation = pronunciation; }
    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }
    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }
    public String getExample() { return example; }
    public void setExample(String example) { this.example = example; }
    public String getExampleTranslation() { return exampleTranslation; }
    public void setExampleTranslation(String exampleTranslation) { this.exampleTranslation = exampleTranslation; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public int getTimesReviewed() { return timesReviewed; }
    public void setTimesReviewed(int timesReviewed) { this.timesReviewed = timesReviewed; }
    public int getTimesCorrect() { return timesCorrect; }
    public void setTimesCorrect(int timesCorrect) { this.timesCorrect = timesCorrect; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
}
