package com.abcenglish.repository;

import com.abcenglish.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseIdOrderByOrderIndex(Long courseId);
    List<Lesson> findByCourseIdAndActiveTrueOrderByOrderIndex(Long courseId);
}
