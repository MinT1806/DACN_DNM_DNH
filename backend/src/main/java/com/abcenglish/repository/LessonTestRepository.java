package com.abcenglish.repository;

import com.abcenglish.entity.LessonTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonTestRepository extends JpaRepository<LessonTest, Long> {
    List<LessonTest> findByLessonIdAndActiveTrue(Long lessonId);
    Optional<LessonTest> findFirstByLessonIdAndActiveTrue(Long lessonId);
    List<LessonTest> findByLessonId(Long lessonId);
}
