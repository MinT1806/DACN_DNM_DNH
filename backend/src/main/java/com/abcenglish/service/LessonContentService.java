package com.abcenglish.service;

import com.abcenglish.entity.LessonContent;
import com.abcenglish.repository.LessonContentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class LessonContentService {

    private final LessonContentRepository contentRepository;
    private final ObjectMapper objectMapper;

    public LessonContentService(LessonContentRepository contentRepository) {
        this.contentRepository = contentRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Optional<LessonContent> getByLessonId(Long lessonId) {
        return contentRepository.findByLessonId(lessonId);
    }

    public Map<String, Object> getContentDetail(Long lessonId) {
        Optional<LessonContent> contentOpt = contentRepository.findByLessonId(lessonId);
        if (contentOpt.isEmpty()) {
            return Map.of(
                "lessonId", lessonId,
                "hasContent", false
            );
        }

        LessonContent content = contentOpt.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", content.getId());
        result.put("lessonId", content.getLessonId());
        result.put("hasContent", true);

        if (content.getTextContent() != null) {
            result.put("textContent", content.getTextContent());
        }
        if (content.getGrammarRules() != null) {
            result.put("grammarRules", parseJsonOrString(content.getGrammarRules()));
        }
        if (content.getVocabulary() != null) {
            result.put("vocabulary", parseJsonOrString(content.getVocabulary()));
        }
        if (content.getKeyPoints() != null) {
            result.put("keyPoints", parseJsonOrString(content.getKeyPoints()));
        }
        result.put("audioUrl", content.getAudioUrl());
        result.put("imageUrl", content.getImageUrl());
        result.put("createdAt", content.getCreatedAt() != null ? content.getCreatedAt().toString() : null);
        result.put("updatedAt", content.getUpdatedAt() != null ? content.getUpdatedAt().toString() : null);

        return result;
    }

    @Transactional
    public LessonContent saveContent(Long lessonId, String textContent, String grammarRules,
                                     String vocabulary, String keyPoints, String audioUrl, String imageUrl) {
        Optional<LessonContent> existing = contentRepository.findByLessonId(lessonId);
        LessonContent content;
        if (existing.isPresent()) {
            content = existing.get();
        } else {
            content = new LessonContent();
            content.setLessonId(lessonId);
        }

        if (textContent != null) content.setTextContent(textContent);
        if (grammarRules != null) content.setGrammarRules(grammarRules);
        if (vocabulary != null) content.setVocabulary(vocabulary);
        if (keyPoints != null) content.setKeyPoints(keyPoints);
        if (audioUrl != null) content.setAudioUrl(audioUrl);
        if (imageUrl != null) content.setImageUrl(imageUrl);

        return contentRepository.save(content);
    }

    @Transactional
    public boolean deleteContent(Long lessonId) {
        Optional<LessonContent> content = contentRepository.findByLessonId(lessonId);
        if (content.isPresent()) {
            contentRepository.delete(content.get());
            return true;
        }
        return false;
    }

    private Object parseJsonOrString(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Object>() {});
        } catch (Exception e) {
            return json;
        }
    }
}
