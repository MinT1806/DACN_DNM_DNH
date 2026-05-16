package com.abcenglish.repository;

import com.abcenglish.entity.Course;
import com.abcenglish.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByLevel(User.Level level);
    List<Course> findByFeaturedTrue();
    List<Course> findByCategory(String category);
    List<Course> findByInstructor(String instructor);
}
