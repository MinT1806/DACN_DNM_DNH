package com.abcenglish.repository;

import com.abcenglish.entity.MiniTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MiniTestRepository extends JpaRepository<MiniTest, Long> {
    Optional<MiniTest> findByLessonIdAndActiveTrue(Long lessonId);
    Optional<MiniTest> findByLessonId(Long lessonId);
}
