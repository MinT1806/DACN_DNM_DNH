package com.abcenglish.repository;

import com.abcenglish.entity.LessonContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LessonContentRepository extends JpaRepository<LessonContent, Long> {
    Optional<LessonContent> findByLessonId(Long lessonId);
    boolean existsByLessonId(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
