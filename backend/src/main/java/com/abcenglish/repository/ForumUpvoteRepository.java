package com.abcenglish.repository;

import com.abcenglish.entity.ForumUpvote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ForumUpvoteRepository extends JpaRepository<ForumUpvote, Long> {
    Optional<ForumUpvote> findByUserIdAndPostId(Long userId, Long postId);
    Optional<ForumUpvote> findByUserIdAndCommentId(Long userId, Long commentId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    boolean existsByUserIdAndCommentId(Long userId, Long commentId);
    void deleteByUserIdAndPostId(Long userId, Long postId);
    void deleteByUserIdAndCommentId(Long userId, Long commentId);
    void deleteByPostId(Long postId);
    void deleteByCommentId(Long commentId);
    List<ForumUpvote> findByPostIdIn(List<Long> postIds);
    List<ForumUpvote> findByCommentIdIn(List<Long> commentIds);

    Optional<ForumUpvote> findByUserIdAndPostIdAndVoteType(Long userId, Long postId, ForumUpvote.VoteType voteType);
    Optional<ForumUpvote> findByUserIdAndCommentIdAndVoteType(Long userId, Long commentId, ForumUpvote.VoteType voteType);

    List<ForumUpvote> findAllByUserIdAndPostId(Long userId, Long postId);
    List<ForumUpvote> findAllByUserIdAndCommentId(Long userId, Long commentId);
}
