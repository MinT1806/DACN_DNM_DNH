package com.abcenglish.repository;

import com.abcenglish.entity.MiniTestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MiniTestQuestionRepository extends JpaRepository<MiniTestQuestion, Long> {
    List<MiniTestQuestion> findByTestIdOrderByOrderIndexAsc(Long testId);
    void deleteByTestId(Long testId);
}
