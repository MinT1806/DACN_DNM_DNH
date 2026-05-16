package com.abcenglish.repository;

import com.abcenglish.entity.MiniTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MiniTestResultRepository extends JpaRepository<MiniTestResult, Long> {
    List<MiniTestResult> findByUserIdOrderByCompletedAtDesc(Long userId);
    List<MiniTestResult> findByLessonIdAndUserIdOrderByCompletedAtDesc(Long lessonId, Long userId);
    Optional<MiniTestResult> findTopByLessonIdAndUserIdOrderByScoreDesc(Long lessonId, Long userId);
}
