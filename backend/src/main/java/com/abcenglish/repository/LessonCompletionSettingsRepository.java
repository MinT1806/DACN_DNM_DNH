package com.abcenglish.repository;

import com.abcenglish.entity.LessonCompletionSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LessonCompletionSettingsRepository extends JpaRepository<LessonCompletionSettings, Long> {
    Optional<LessonCompletionSettings> findByLessonId(Long lessonId);
}
