package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.StoryRepository;
import com.abcenglish.repository.StoryStepRepository;
import com.abcenglish.repository.UserStoryProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StoryService {
    private static final Logger log = LoggerFactory.getLogger(StoryService.class);

    private final StoryRepository storyRepository;
    private final StoryStepRepository storyStepRepository;
    private final UserStoryProgressRepository progressRepository;

    public StoryService(
            StoryRepository storyRepository,
            StoryStepRepository storyStepRepository,
            UserStoryProgressRepository progressRepository
    ) {
        this.storyRepository = storyRepository;
        this.storyStepRepository = storyStepRepository;
        this.progressRepository = progressRepository;
    }

    public List<Map<String, Object>> getAllStories(User.Level userLevel) {
        List<Story> stories = storyRepository.findByActiveTrueOrderByCreatedAtDesc();
        return stories.stream()
                .map(s -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", s.getId());
                    item.put("title", s.getTitle());
                    item.put("description", s.getDescription());
                    item.put("thumbnailUrl", s.getThumbnailUrl());
                    item.put("level", s.getLevel() != null ? s.getLevel().name() : null);
                    item.put("category", s.getCategory());
                    item.put("estimatedMinutes", s.getEstimatedMinutes());
                    item.put("totalSteps", s.getSteps().size());
                    item.put("createdAt", s.getCreatedAt());
                    return item;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStoryById(Long storyId, Long userId) {
        Story story = storyRepository.findByIdAndActiveTrue(storyId).orElse(null);
        if (story == null) {
            return null;
        }

        UserStoryProgress progress = progressRepository.findByUserIdAndStoryId(userId, storyId).orElse(null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", story.getId());
        result.put("title", story.getTitle());
        result.put("description", story.getDescription());
        result.put("thumbnailUrl", story.getThumbnailUrl());
        result.put("level", story.getLevel() != null ? story.getLevel().name() : null);
        result.put("category", story.getCategory());
        result.put("estimatedMinutes", story.getEstimatedMinutes());

        if (progress != null) {
            result.put("currentStep", progress.getCurrentStep());
            result.put("correctCount", progress.getCorrectCount());
            result.put("score", progress.getScore());
            result.put("completed", progress.isCompleted());
            result.put("lastAccessedAt", progress.getLastAccessedAt());
        } else {
            result.put("currentStep", 0);
            result.put("correctCount", 0);
            result.put("score", 0);
            result.put("completed", false);
        }

        List<Map<String, Object>> steps = story.getSteps().stream()
                .map(step -> {
                    Map<String, Object> stepMap = new LinkedHashMap<>();
                    stepMap.put("id", step.getId());
                    stepMap.put("stepOrder", step.getStepOrder());
                    stepMap.put("content", step.getContent());
                    stepMap.put("imageUrl", step.getImageUrl());
                    stepMap.put("question", step.getQuestion());
                    stepMap.put("options", new String[]{
                            step.getOptionA(),
                            step.getOptionB(),
                            step.getOptionC() != null ? step.getOptionC() : ""
                    });
                    stepMap.put("correctOption", step.getCorrectOption());
                    stepMap.put("explanation", step.getExplanation());
                    return stepMap;
                })
                .collect(Collectors.toList());

        result.put("steps", steps);
        result.put("totalSteps", steps.size());

        return result;
    }

    @Transactional
    public Map<String, Object> submitAnswer(Long storyId, Long userId, int stepOrder, String answer) {
        Story story = storyRepository.findByIdAndActiveTrue(storyId).orElse(null);
        if (story == null) {
            return Map.of("success", false, "error", "Story not found");
        }

        StoryStep step = story.getSteps().stream()
                .filter(s -> s.getStepOrder() == stepOrder)
                .findFirst()
                .orElse(null);

        if (step == null) {
            return Map.of("success", false, "error", "Step not found");
        }

        boolean correct = step.getCorrectOption().equalsIgnoreCase(answer.trim());

        UserStoryProgress progress = progressRepository.findByUserIdAndStoryId(userId, storyId)
                .orElseGet(() -> {
                    UserStoryProgress p = new UserStoryProgress();
                    p.setUserId(userId);
                    p.setStoryId(storyId);
                    p.setTotalSteps(story.getSteps().size());
                    p.setCurrentStep(0);
                    p.setCorrectCount(0);
                    p.setScore(0);
                    p.setCompleted(false);
                    return progressRepository.save(p);
                });

        if (progress.isCompleted()) {
            return Map.of(
                    "success", false,
                    "error", "Story already completed",
                    "completed", true,
                    "score", progress.getScore(),
                    "correctCount", progress.getCorrectCount()
            );
        }

        if (correct) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
        }

        int nextStep = stepOrder + 1;
        boolean isLastStep = stepOrder >= story.getSteps().size();
        boolean justCompleted = false;

        if (isLastStep) {
            int totalSteps = story.getSteps().size();
            int score = (int) Math.round((double) progress.getCorrectCount() / totalSteps * 100);
            progress.setScore(score);
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            justCompleted = true;
        } else {
            progress.setCurrentStep(nextStep);
        }

        progress.setLastAccessedAt(LocalDateTime.now());
        progressRepository.save(progress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("correct", correct);
        response.put("correctAnswer", step.getCorrectOption());
        response.put("explanation", step.getExplanation());
        response.put("nextStep", nextStep);
        response.put("isLastStep", isLastStep);
        response.put("completed", justCompleted);
        response.put("score", justCompleted ? progress.getScore() : null);
        response.put("totalSteps", story.getSteps().size());
        response.put("correctCount", progress.getCorrectCount());

        return response;
    }

    public List<Map<String, Object>> getUserStoryProgress(Long userId) {
        List<UserStoryProgress> progressList = progressRepository.findByUserIdOrderByLastAccessedAtDesc(userId);
        return progressList.stream()
                .map(p -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("storyId", p.getStoryId());
                    item.put("currentStep", p.getCurrentStep());
                    item.put("correctCount", p.getCorrectCount());
                    item.put("totalSteps", p.getTotalSteps());
                    item.put("completed", p.isCompleted());
                    item.put("score", p.getScore());
                    item.put("lastAccessedAt", p.getLastAccessedAt());
                    return item;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStoryListByLevel(User.Level level) {
        List<Story> stories = storyRepository.findByLevelAndActiveTrueOrderByCreatedAtDesc(level);
        return Map.of("stories", stories.stream().map(s -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", s.getId());
            item.put("title", s.getTitle());
            item.put("description", s.getDescription());
            item.put("thumbnailUrl", s.getThumbnailUrl());
            item.put("estimatedMinutes", s.getEstimatedMinutes());
            item.put("totalSteps", s.getSteps().size());
            return item;
        }).collect(Collectors.toList()));
    }
}
