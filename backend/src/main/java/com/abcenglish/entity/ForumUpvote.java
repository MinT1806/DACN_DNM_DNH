package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_upvotes")
public class ForumUpvote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long postId;

    private Long commentId;

    @Column(nullable = false)
    private boolean upvoted = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteType voteType = VoteType.UP;

    private LocalDateTime createdAt;

    public ForumUpvote() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public Long getCommentId() { return commentId; }
    public void setCommentId(Long commentId) { this.commentId = commentId; }
    public boolean isUpvoted() { return upvoted; }
    public void setUpvoted(boolean upvoted) { this.upvoted = upvoted; }
    public VoteType getVoteType() { return voteType; }
    public void setVoteType(VoteType voteType) { this.voteType = voteType; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public enum VoteType { UP, DOWN }
}
