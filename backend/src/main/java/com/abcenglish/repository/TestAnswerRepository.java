package com.abcenglish.repository;

import com.abcenglish.entity.TestAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestAnswerRepository extends JpaRepository<TestAnswer, Long> {
    List<TestAnswer> findBySessionId(Long sessionId);
    Optional<TestAnswer> findBySessionIdAndQuestionIndex(Long sessionId, int questionIndex);
    void deleteBySessionId(Long sessionId);
    long countBySessionId(Long sessionId);
}
