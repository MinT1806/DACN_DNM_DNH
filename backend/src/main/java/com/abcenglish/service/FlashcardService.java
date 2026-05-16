package com.abcenglish.service;

import com.abcenglish.entity.SavedWord;
import com.abcenglish.entity.User;
import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.repository.SavedWordRepository;
import com.abcenglish.repository.VocabularyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FlashcardService {
    private static final Logger log = LoggerFactory.getLogger(FlashcardService.class);

    private final SavedWordRepository savedWordRepository;
    private final VocabularyRepository vocabularyRepository;

    public FlashcardService(SavedWordRepository savedWordRepository, VocabularyRepository vocabularyRepository) {
        this.savedWordRepository = savedWordRepository;
        this.vocabularyRepository = vocabularyRepository;
    }

    public List<Map<String, Object>> getTodayCards(Long userId) {
        List<SavedWord> words = savedWordRepository.findByUserIdOrderBySavedAtDesc(userId);

        List<Map<String, Object>> dueCards = words.stream()
                .filter(w -> !w.isLearned() && isDue(w))
                .map(this::toCardResponse)
                .collect(Collectors.toList());

        if (dueCards.isEmpty()) {
            List<Map<String, Object>> newCards = words.stream()
                    .filter(w -> !w.isLearned() && w.getReviewCount() == 0)
                    .limit(10)
                    .map(this::toCardResponse)
                    .collect(Collectors.toList());
            if (!newCards.isEmpty()) {
                return newCards;
            }
        }

        return dueCards;
    }

    @Transactional
    public Map<String, Object> reviewCard(Long userId, Long vocabularyId, String rating) {
        SavedWord word = savedWordRepository.findByUserIdOrderBySavedAtDesc(userId)
                .stream()
                .filter(w -> w.getVocabularyId().equals(vocabularyId))
                .findFirst()
                .orElse(null);

        if (word == null) {
            return Map.of("success", false, "error", "Card not found");
        }

        int currentInterval = word.getIntervalDays() > 0 ? word.getIntervalDays() : 1;
        int newInterval;

        switch (rating.toLowerCase()) {
            case "again":
                newInterval = 1;
                break;
            case "hard":
                newInterval = Math.max(1, (int) Math.round(currentInterval * 1.2));
                break;
            case "good":
                newInterval = Math.max(1, currentInterval * 2);
                break;
            case "easy":
                newInterval = Math.max(1, (int) Math.round(currentInterval * 2.5));
                break;
            default:
                newInterval = currentInterval;
        }

        word.setIntervalDays(newInterval);
        word.setNextReviewDate(LocalDate.now().plusDays(newInterval));
        word.setLastReviewedAt(LocalDateTime.now());
        word.setReviewCount(word.getReviewCount() + 1);

        if (rating.equalsIgnoreCase("again")) {
            word.setCorrectCount(0);
        } else {
            word.setCorrectCount(word.getCorrectCount() + 1);
            if (word.getCorrectCount() >= 5 && newInterval >= 21) {
                word.setLearned(true);
            }
        }

        savedWordRepository.save(word);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("nextReviewDate", word.getNextReviewDate().toString());
        result.put("intervalDays", newInterval);
        result.put("learned", word.isLearned());
        result.put("reviewCount", word.getReviewCount());
        result.put("correctCount", word.getCorrectCount());

        return result;
    }

    public Map<String, Object> getFlashcardStats(Long userId) {
        List<SavedWord> allWords = savedWordRepository.findByUserIdOrderBySavedAtDesc(userId);

        int totalSaved = allWords.size();
        int totalLearned = (int) allWords.stream().filter(SavedWord::isLearned).count();
        int dueToday = (int) allWords.stream()
                .filter(w -> !w.isLearned() && isDue(w))
                .count();
        int totalReviews = allWords.stream().mapToInt(SavedWord::getReviewCount).sum();
        int totalCorrect = allWords.stream().mapToInt(SavedWord::getCorrectCount).sum();
        double accuracy = totalReviews > 0 ? (double) totalCorrect / totalReviews * 100 : 0;

        int mastered = (int) allWords.stream()
                .filter(w -> w.isLearned() && w.getIntervalDays() >= 30)
                .count();

        List<Map<String, Object>> levelBreakdown = Arrays.stream(new String[]{"A1", "A2", "B1", "B2", "C1", "C2"})
                .map(level -> {
                    int count = (int) allWords.stream()
                            .filter(w -> level.equals(w.getLevel()))
                            .count();
                    int learned = (int) allWords.stream()
                            .filter(w -> level.equals(w.getLevel()) && w.isLearned())
                            .count();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("level", level);
                    item.put("total", count);
                    item.put("learned", learned);
                    item.put("due", (int) allWords.stream()
                            .filter(w -> level.equals(w.getLevel()) && !w.isLearned() && isDue(w))
                            .count());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalSaved", totalSaved);
        stats.put("totalLearned", totalLearned);
        stats.put("mastered", mastered);
        stats.put("dueToday", dueToday);
        stats.put("totalReviews", totalReviews);
        stats.put("totalCorrect", totalCorrect);
        stats.put("accuracy", Math.round(accuracy * 100.0) / 100.0);
        stats.put("newCards", (int) allWords.stream().filter(w -> !w.isLearned() && w.getReviewCount() == 0).count());
        stats.put("levelBreakdown", levelBreakdown);

        return stats;
    }

    private boolean isDue(SavedWord word) {
        if (word.getNextReviewDate() == null) {
            return word.getReviewCount() == 0 || true;
        }
        return !word.getNextReviewDate().isAfter(LocalDate.now());
    }

    private Map<String, Object> toCardResponse(SavedWord word) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", word.getId());
        card.put("vocabularyId", word.getVocabularyId());
        card.put("word", word.getWord());
        card.put("translation", word.getTranslation());
        card.put("pronunciation", word.getPronunciation());
        card.put("level", word.getLevel());
        card.put("reviewCount", word.getReviewCount());
        card.put("correctCount", word.getCorrectCount());
        card.put("intervalDays", word.getIntervalDays() > 0 ? word.getIntervalDays() : 1);
        card.put("nextReviewDate", word.getNextReviewDate() != null ? word.getNextReviewDate().toString() : LocalDate.now().toString());
        card.put("learned", word.isLearned());
        card.put("lastReviewedAt", word.getLastReviewedAt());
        return card;
    }

    @Transactional
    public Map<String, Object> addNewWord(Long userId, String wordText, String translation, String pronunciation, String level) {
        VocabularyWord vocab = new VocabularyWord();
        vocab.setWord(wordText);
        vocab.setTranslation(translation);
        vocab.setPronunciation(pronunciation);
        if (level != null) {
            try {
                vocab.setLevel(User.Level.valueOf(level.toUpperCase()));
            } catch (Exception ignored) {}
        }
        vocab = vocabularyRepository.save(vocab);

        SavedWord saved = new SavedWord();
        saved.setUserId(userId);
        saved.setVocabularyId(vocab.getId());
        saved.setWord(wordText);
        saved.setTranslation(translation);
        saved.setPronunciation(pronunciation);
        saved.setLevel(level);
        saved.setIntervalDays(1);
        saved.setNextReviewDate(LocalDate.now().plusDays(1));
        saved = savedWordRepository.save(saved);

        return toCardResponse(saved);
    }

    public List<Map<String, Object>> getAllCards(Long userId) {
        return savedWordRepository.findByUserIdOrderBySavedAtDesc(userId)
                .stream()
                .map(this::toCardResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean deleteCard(Long userId, Long vocabularyId) {
        if (!savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabularyId)) {
            return false;
        }
        savedWordRepository.deleteByUserIdAndVocabularyId(userId, vocabularyId);
        return true;
    }
}
