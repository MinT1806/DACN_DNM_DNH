package com.abcenglish.repository;

import com.abcenglish.entity.VideoSubtitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VideoSubtitleRepository extends JpaRepository<VideoSubtitle, Long> {
    List<VideoSubtitle> findByLessonIdOrderByOrderIndex(Long lessonId);
    List<VideoSubtitle> findByLessonIdAndLanguageOrderByOrderIndex(Long lessonId, String language);
    void deleteByLessonId(Long lessonId);
}
