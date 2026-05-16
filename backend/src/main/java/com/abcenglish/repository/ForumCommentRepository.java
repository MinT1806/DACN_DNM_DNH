package com.abcenglish.repository;

import com.abcenglish.entity.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    List<ForumComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<ForumComment> findByPostIdOrderByUpvoteCountDesc(Long postId);
    int countByPostId(Long postId);
}
