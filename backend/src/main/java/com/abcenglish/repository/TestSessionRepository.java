package com.abcenglish.repository;

import com.abcenglish.entity.TestSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestSessionRepository extends JpaRepository<TestSession, Long> {
    List<TestSession> findByUserIdOrderByStartedAtDesc(Long userId);
    List<TestSession> findByTestIdAndUserId(Long testId, Long userId);
    List<TestSession> findByUserIdAndStatus(Long userId, TestSession.TestStatus status);
}
