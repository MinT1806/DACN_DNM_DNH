package com.abcenglish.repository;

import com.abcenglish.entity.LessonTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonTestResultRepository extends JpaRepository<LessonTestResult, Long> {
    List<LessonTestResult> findByUserIdOrderBySubmittedAtDesc(Long userId);
    List<LessonTestResult> findByUserId(Long userId);
    List<LessonTestResult> findByTestId(Long testId);
    List<LessonTestResult> findByLessonId(Long lessonId);
    Optional<LessonTestResult> findTopByUserIdAndTestIdOrderBySubmittedAtDesc(Long userId, Long testId);
    @Query("SELECT ltr FROM LessonTestResult ltr WHERE ltr.userId = :userId ORDER BY ltr.submittedAt DESC")
    List<LessonTestResult> findRecentResults(Long userId);
    long countByUserId(Long userId);
    @Query("SELECT AVG(ltr.score) FROM LessonTestResult ltr WHERE ltr.userId = :userId")
    Double findAverageScoreByUserId(Long userId);
}
