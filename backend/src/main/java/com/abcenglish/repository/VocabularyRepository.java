package com.abcenglish.repository;

import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<VocabularyWord, Long> {
    List<VocabularyWord> findByLevel(User.Level level);
    List<VocabularyWord> findByCategory(String category);
}
