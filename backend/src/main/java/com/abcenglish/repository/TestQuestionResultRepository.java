package com.abcenglish.repository;

import com.abcenglish.entity.TestQuestionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestQuestionResultRepository extends JpaRepository<TestQuestionResult, Long> {
    List<TestQuestionResult> findByResultId(Long resultId);
    List<TestQuestionResult> findBySessionId(Long sessionId);
    List<TestQuestionResult> findBySessionIdAndAiGraded(Long sessionId, boolean aiGraded);
}
