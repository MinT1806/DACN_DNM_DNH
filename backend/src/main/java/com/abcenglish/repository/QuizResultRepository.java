package com.abcenglish.repository;

import com.abcenglish.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByUserId(Long userId);
    List<QuizResult> findByUserIdOrderByCompletedAtDesc(Long userId);
    List<QuizResult> findByUserIdAndCompletedAtAfter(Long userId, LocalDateTime after);
}
