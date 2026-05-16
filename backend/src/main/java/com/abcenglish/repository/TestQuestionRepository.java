package com.abcenglish.repository;

import com.abcenglish.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {
    List<TestQuestion> findByTestIdOrderByOrderIndexAsc(Long testId);
    List<TestQuestion> findByLessonIdOrderByOrderIndexAsc(Long lessonId);
    List<TestQuestion> findByTestId(Long testId);
    int countByTestId(Long testId);
}
