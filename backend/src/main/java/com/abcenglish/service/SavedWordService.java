package com.abcenglish.service;

import com.abcenglish.entity.SavedWord;
import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.repository.SavedWordRepository;
import com.abcenglish.repository.VocabularyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SavedWordService {
    
    private static final Logger log = LoggerFactory.getLogger(SavedWordService.class);
    private static final int LEARNED_THRESHOLD = 3;
    
    private final SavedWordRepository savedWordRepository;
    private final VocabularyRepository vocabularyRepository;
    
    public SavedWordService(SavedWordRepository savedWordRepository, VocabularyRepository vocabularyRepository) {
        this.savedWordRepository = savedWordRepository;
        this.vocabularyRepository = vocabularyRepository;
    }
    
    @Transactional
    public SavedWord saveWord(Long userId, Long vocabularyId) {
        if (savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabularyId)) {
            log.info("Word {} already saved for user {}", vocabularyId, userId);
            return savedWordRepository.findByUserIdAndLearnedFalseOrderBySavedAtDesc(userId)
                    .stream()
                    .filter(sw -> sw.getVocabularyId().equals(vocabularyId))
                    .findFirst()
                    .orElse(null);
        }
        
        Optional<VocabularyWord> vocabOpt = vocabularyRepository.findById(vocabularyId);
        if (vocabOpt.isEmpty()) {
            log.warn("Vocabulary {} not found", vocabularyId);
            return null;
        }
        
        VocabularyWord vocab = vocabOpt.get();
        SavedWord savedWord = new SavedWord();
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabularyId);
        savedWord.setWord(vocab.getWord());
        savedWord.setTranslation(vocab.getTranslation());
        savedWord.setPronunciation(vocab.getPronunciation());
        savedWord.setLevel(vocab.getLevel() != null ? vocab.getLevel().name() : null);
        savedWord.setIntervalDays(1);
        savedWord.setNextReviewDate(LocalDate.now().plusDays(1));

        return savedWordRepository.save(savedWord);
    }
    
    @Transactional
    public boolean unSaveWord(Long userId, Long vocabularyId) {
        if (!savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabularyId)) {
            log.info("Word {} not saved for user {}", vocabularyId, userId);
            return false;
        }
        savedWordRepository.deleteByUserIdAndVocabularyId(userId, vocabularyId);
        log.info("Word {} unsaved for user {}", vocabularyId, userId);
        return true;
    }
    
    public List<SavedWord> getSavedWords(Long userId) {
        return savedWordRepository.findByUserIdOrderBySavedAtDesc(userId);
    }
    
    public List<SavedWord> getFlashcardWords(Long userId) {
        return savedWordRepository.findByUserIdAndLearnedFalseOrderBySavedAtDesc(userId);
    }
    
    @Transactional
    public SavedWord markAsReviewed(Long userId, Long vocabularyId, boolean correct) {
        Optional<SavedWord> savedWordOpt = savedWordRepository.findByUserIdOrderBySavedAtDesc(userId)
                .stream()
                .filter(sw -> sw.getVocabularyId().equals(vocabularyId))
                .findFirst();
        
        if (savedWordOpt.isEmpty()) {
            log.warn("Saved word {} not found for user {}", vocabularyId, userId);
            return null;
        }
        
        SavedWord savedWord = savedWordOpt.get();
        savedWord.setReviewCount(savedWord.getReviewCount() + 1);
        savedWord.setLastReviewedAt(LocalDateTime.now());
        
        if (correct) {
            savedWord.setCorrectCount(savedWord.getCorrectCount() + 1);
            if (savedWord.getCorrectCount() >= LEARNED_THRESHOLD) {
                savedWord.setLearned(true);
                log.info("Word {} marked as learned for user {} after {} correct answers", 
                        vocabularyId, userId, LEARNED_THRESHOLD);
            }
        }
        
        return savedWordRepository.save(savedWord);
    }
    
    public Map<String, Object> getFlashcardStats(Long userId) {
        List<SavedWord> allWords = savedWordRepository.findByUserIdOrderBySavedAtDesc(userId);
        List<SavedWord> learnedWords = allWords.stream()
                .filter(SavedWord::isLearned)
                .toList();
        
        int totalSaved = allWords.size();
        int totalLearned = learnedWords.size();
        int totalReviews = allWords.stream().mapToInt(SavedWord::getReviewCount).sum();
        int totalCorrect = allWords.stream().mapToInt(SavedWord::getCorrectCount).sum();
        
        double accuracy = totalReviews > 0 ? (double) totalCorrect / totalReviews * 100 : 0;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSaved", totalSaved);
        stats.put("totalLearned", totalLearned);
        stats.put("totalReviews", totalReviews);
        stats.put("totalCorrect", totalCorrect);
        stats.put("accuracy", Math.round(accuracy * 100.0) / 100.0);

        return stats;
    }
}
