package com.abcenglish.repository;

import com.abcenglish.entity.LessonVocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LessonVocabularyRepository extends JpaRepository<LessonVocabulary, Long> {
    List<LessonVocabulary> findByLessonIdOrderByOrderIndex(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
