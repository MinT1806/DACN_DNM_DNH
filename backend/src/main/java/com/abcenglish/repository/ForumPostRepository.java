package com.abcenglish.repository;

import com.abcenglish.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findAllByOrderByCreatedAtDesc();
    List<ForumPost> findAllByOrderByUpvoteCountDesc();
    List<ForumPost> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ForumPost> findBySolvedTrueOrderByCreatedAtDesc();
    List<ForumPost> findTop50ByOrderByUpvoteCountDesc();
    List<ForumPost> findByOrderByUpvoteCountDesc(Pageable pageable);
    List<ForumPost> findByOrderByCreatedAtDesc(Pageable pageable);
    List<ForumPost> findByTagsContainingIgnoreCaseOrderByCreatedAtDesc(String tag, Pageable pageable);
    List<ForumPost> findByTagsContainingIgnoreCaseOrderByUpvoteCountDesc(String tag, Pageable pageable);
    List<ForumPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(String title, String content, Pageable pageable);
    List<ForumPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByUpvoteCountDesc(String title, String content, Pageable pageable);
}
