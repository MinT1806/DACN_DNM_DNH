package com.abcenglish.dto;

import com.abcenglish.entity.Course;
import java.time.LocalDateTime;

public class CourseDTO {
    private Long id;
    private String title;
    private String description;
    private String level;
    private String instructor;
    private String instructorAvatar;
    private int totalLessons;
    private int completedLessons;
    private double rating;
    private String thumbnailUrl;
    private String category;
    private boolean featured;
    private int enrolledCount;
    private LocalDateTime createdAt;

    public CourseDTO() {}

    public static CourseDTO fromEntity(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setLevel(course.getLevel() != null ? course.getLevel().name() : null);
        dto.setInstructor(course.getInstructor());
        dto.setInstructorAvatar(course.getInstructorAvatar());
        dto.setTotalLessons(course.getTotalLessons());
        dto.setCompletedLessons(course.getCompletedLessons());
        dto.setRating(course.getRating());
        dto.setThumbnailUrl(course.getThumbnailUrl());
        dto.setCategory(course.getCategory());
        dto.setFeatured(course.isFeatured());
        dto.setEnrolledCount(course.getEnrolledCount());
        dto.setCreatedAt(course.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }
    public String getInstructorAvatar() { return instructorAvatar; }
    public void setInstructorAvatar(String instructorAvatar) { this.instructorAvatar = instructorAvatar; }
    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }
    public int getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(int completedLessons) { this.completedLessons = completedLessons; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
