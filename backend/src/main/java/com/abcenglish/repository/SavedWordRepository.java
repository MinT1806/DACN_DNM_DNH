package com.abcenglish.repository;

import com.abcenglish.entity.SavedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedWordRepository extends JpaRepository<SavedWord, Long> {
    List<SavedWord> findByUserIdOrderBySavedAtDesc(Long userId);
    
    List<SavedWord> findByUserIdAndLearnedFalseOrderBySavedAtDesc(Long userId);
    
    boolean existsByUserIdAndVocabularyId(Long userId, Long vocabularyId);
    
    void deleteByUserIdAndVocabularyId(Long userId, Long vocabularyId);
    
    int countByUserIdAndLearnedFalse(Long userId);
    
    int countByUserId(Long userId);
}
