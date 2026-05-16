package com.abcenglish.repository;

import com.abcenglish.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    List<TestResult> findByUserIdOrderByCompletedAtDesc(Long userId);
    List<TestResult> findByUserId(Long userId);

    List<TestResult> findByTestSessionId(Long testSessionId);

    List<TestResult> findByUserIdAndTestType(Long userId, String testType);

    List<TestResult> findByUserIdAndCompletedAtAfter(Long userId, LocalDateTime after);

    Optional<TestResult> findTopByUserIdAndTestIdOrderByCompletedAtDesc(Long userId, Long testId);

    @Query("SELECT tr FROM TestResult tr WHERE tr.completedAt >= :after ORDER BY tr.score DESC")
    List<TestResult> findRecentResults(LocalDateTime after);

    long countByUserId(Long userId);

    @Query("SELECT AVG(tr.score) FROM TestResult tr WHERE tr.userId = :userId")
    Double findAverageScoreByUserId(Long userId);
}
