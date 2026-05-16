package com.abcenglish.service;

import com.abcenglish.entity.ForumPost;
import com.abcenglish.entity.ForumComment;
import com.abcenglish.entity.ForumUpvote;
import com.abcenglish.entity.User;
import com.abcenglish.repository.ForumPostRepository;
import com.abcenglish.repository.ForumCommentRepository;
import com.abcenglish.repository.ForumUpvoteRepository;
import com.abcenglish.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ForumService {

    private static final int REPUTATION_UPVOTE_RECEIVED = 10;
    private static final int REPUTATION_DOWNVOTE_RECEIVED = -2;
    private static final int REPUTATION_ANSWER_ACCEPTED = 15;
    private static final int REPUTATION_POST_CREATED = 5;

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final ForumUpvoteRepository upvoteRepository;
    private final UserRepository userRepository;

    public ForumService(ForumPostRepository postRepository,
                        ForumCommentRepository commentRepository,
                        ForumUpvoteRepository upvoteRepository,
                        UserRepository userRepository) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.upvoteRepository = upvoteRepository;
        this.userRepository = userRepository;
    }

    // ─── Posts ────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getPosts(String sort, int page, int size) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> result = (List<Map<String, Object>>) getPostsWithTag(sort, page, size, null).get("posts");
        return result;
    }

    public Map<String, Object> getPostsWithTag(String sort, int page, int size, String tag) {
        List<ForumPost> posts;
        Pageable pageable = PageRequest.of(page, size);

        boolean isPopular = "popular".equalsIgnoreCase(sort);

        if (tag != null && !tag.isBlank()) {
            posts = isPopular
                    ? postRepository.findByTagsContainingIgnoreCaseOrderByUpvoteCountDesc(tag.trim(), pageable)
                    : postRepository.findByTagsContainingIgnoreCaseOrderByCreatedAtDesc(tag.trim(), pageable);
        } else {
            posts = isPopular
                    ? postRepository.findByOrderByUpvoteCountDesc(pageable)
                    : postRepository.findByOrderByCreatedAtDesc(pageable);
        }

        List<Map<String, Object>> enriched = enrichPosts(posts, null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("posts", enriched);
        result.put("page", page);
        result.put("size", size);
        result.put("total", enriched.size());
        result.put("tag", tag);
        result.put("sort", sort);
        return result;
    }

    public Map<String, Object> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<ForumPost> posts = postRepository
                .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(keyword, keyword, pageable);

        List<Map<String, Object>> enriched = enrichPosts(posts, null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("posts", enriched);
        result.put("keyword", keyword);
        result.put("page", page);
        result.put("size", size);
        result.put("total", enriched.size());
        return result;
    }

    public List<Map<String, Object>> getPopularTags() {
        List<ForumPost> allPosts = postRepository.findAll();
        Map<String, Integer> tagCounts = new HashMap<>();

        for (ForumPost post : allPosts) {
            if (post.getTags() != null && !post.getTags().isBlank()) {
                for (String tag : post.getTags().split(",")) {
                    String trimmed = tag.trim().toLowerCase();
                    if (!trimmed.isEmpty()) {
                        tagCounts.merge(trimmed, 1, Integer::sum);
                    }
                }
            }
        }

        return tagCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(20)
                .map(e -> {
                    Map<String, Object> tag = new LinkedHashMap<>();
                    tag.put("name", e.getKey());
                    tag.put("count", e.getValue());
                    return tag;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getPostById(Long postId, Long currentUserId) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null) return null;

        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);

        Map<String, Object> result = enrichPost(post, currentUserId);
        return result;
    }

    @Transactional
    public ForumPost createPost(Long userId, String title, String content, String tags) {
        ForumPost post = new ForumPost();
        post.setUserId(userId);
        post.setTitle(title);
        post.setContent(content);
        post.setTags(tags);
        ForumPost saved = postRepository.save(post);

        // Update user stats
        userRepository.findById(userId).ifPresent(user -> {
            user.setForumPosts(user.getForumPosts() + 1);
            user.setForumReputation(user.getForumReputation() + REPUTATION_POST_CREATED);
            userRepository.save(user);
        });

        return saved;
    }

    @Transactional
    public ForumPost updatePost(Long postId, Long userId, String title, String content, String tags) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null || !post.getUserId().equals(userId)) return null;
        if (title != null) post.setTitle(title);
        if (content != null) post.setContent(content);
        if (tags != null) post.setTags(tags);
        return postRepository.save(post);
    }

    @Transactional
    public boolean deletePost(Long postId, Long userId) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null || !post.getUserId().equals(userId)) return false;

        List<ForumComment> postComments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        for (ForumComment c : postComments) {
            upvoteRepository.deleteByCommentId(c.getId());
            commentRepository.delete(c);
        }
        upvoteRepository.deleteByPostId(postId);
        postRepository.delete(post);
        return true;
    }

    // ─── Votes ────────────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> togglePostUpvote(Long userId, Long postId) {
        return votePost(userId, postId, "up");
    }

    @Transactional
    public Map<String, Object> votePost(Long userId, Long postId, String voteType) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null) return null;

        ForumUpvote.VoteType requested = "down".equalsIgnoreCase(voteType)
                ? ForumUpvote.VoteType.DOWN
                : ForumUpvote.VoteType.UP;

        List<ForumUpvote> existingVotes = upvoteRepository.findAllByUserIdAndPostId(userId, postId);

        int upvoteDelta = 0;
        int downvoteDelta = 0;
        boolean upvotedNow = false;
        boolean downvotedNow = false;

        if (existingVotes.isEmpty()) {
            // New vote
            ForumUpvote vote = new ForumUpvote();
            vote.setUserId(userId);
            vote.setPostId(postId);
            vote.setVoteType(requested);
            vote.setUpvoted(true);
            upvoteRepository.save(vote);

            if (requested == ForumUpvote.VoteType.UP) {
                upvoteDelta = 1;
                upvotedNow = true;
                addReputation(post.getUserId(), REPUTATION_UPVOTE_RECEIVED);
            } else {
                downvoteDelta = 1;
                downvotedNow = true;
                addReputation(post.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
            }
        } else {
            // Toggle: if same type, remove; if different, switch
            ForumUpvote existingUp = existingVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.UP).findFirst().orElse(null);
            ForumUpvote existingDown = existingVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.DOWN).findFirst().orElse(null);

            if (requested == ForumUpvote.VoteType.UP) {
                if (existingUp != null) {
                    upvoteRepository.delete(existingUp);
                    upvoteDelta = -1;
                    addReputation(post.getUserId(), -REPUTATION_UPVOTE_RECEIVED);
                }
                if (existingDown != null) {
                    upvoteRepository.delete(existingDown);
                    downvoteDelta = -1;
                    addReputation(post.getUserId(), -REPUTATION_DOWNVOTE_RECEIVED);
                    upvoteDelta = 1;
                    upvotedNow = true;
                    addReputation(post.getUserId(), REPUTATION_UPVOTE_RECEIVED);
                } else if (existingUp == null) {
                    ForumUpvote vote = new ForumUpvote();
                    vote.setUserId(userId);
                    vote.setPostId(postId);
                    vote.setVoteType(ForumUpvote.VoteType.UP);
                    vote.setUpvoted(true);
                    upvoteRepository.save(vote);
                    upvoteDelta = 1;
                    upvotedNow = true;
                    addReputation(post.getUserId(), REPUTATION_UPVOTE_RECEIVED);
                }
            } else {
                if (existingDown != null) {
                    upvoteRepository.delete(existingDown);
                    downvoteDelta = -1;
                    addReputation(post.getUserId(), -REPUTATION_DOWNVOTE_RECEIVED);
                }
                if (existingUp != null) {
                    upvoteRepository.delete(existingUp);
                    upvoteDelta = -1;
                    addReputation(post.getUserId(), -REPUTATION_UPVOTE_RECEIVED);
                    downvoteDelta = 1;
                    downvotedNow = true;
                    addReputation(post.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
                } else if (existingDown == null) {
                    ForumUpvote vote = new ForumUpvote();
                    vote.setUserId(userId);
                    vote.setPostId(postId);
                    vote.setVoteType(ForumUpvote.VoteType.DOWN);
                    vote.setUpvoted(false);
                    upvoteRepository.save(vote);
                    downvoteDelta = 1;
                    downvotedNow = true;
                    addReputation(post.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
                }
            }
        }

        post.setUpvoteCount(Math.max(0, post.getUpvoteCount() + upvoteDelta - downvoteDelta));
        postRepository.save(post);

        Map<String, Object> result = new HashMap<>();
        result.put("upvoteCount", post.getUpvoteCount());
        result.put("upvoted", upvotedNow);
        result.put("downvoted", downvotedNow);
        result.put("voteType", upvotedNow ? "up" : (downvotedNow ? "down" : "none"));
        return result;
    }

    @Transactional
    public Map<String, Object> voteComment(Long userId, Long commentId, String voteType) {
        ForumComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) return null;

        ForumUpvote.VoteType requested = "down".equalsIgnoreCase(voteType)
                ? ForumUpvote.VoteType.DOWN
                : ForumUpvote.VoteType.UP;

        List<ForumUpvote> existingVotes = upvoteRepository.findAllByUserIdAndCommentId(userId, commentId);

        int upvoteDelta = 0;
        int downvoteDelta = 0;
        boolean upvotedNow = false;
        boolean downvotedNow = false;

        if (existingVotes.isEmpty()) {
            ForumUpvote vote = new ForumUpvote();
            vote.setUserId(userId);
            vote.setCommentId(commentId);
            vote.setVoteType(requested);
            vote.setUpvoted(true);
            upvoteRepository.save(vote);

            if (requested == ForumUpvote.VoteType.UP) {
                upvoteDelta = 1;
                upvotedNow = true;
                addReputation(comment.getUserId(), REPUTATION_UPVOTE_RECEIVED);
            } else {
                downvoteDelta = 1;
                downvotedNow = true;
                addReputation(comment.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
            }
        } else {
            ForumUpvote existingUp = existingVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.UP).findFirst().orElse(null);
            ForumUpvote existingDown = existingVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.DOWN).findFirst().orElse(null);

            if (requested == ForumUpvote.VoteType.UP) {
                if (existingUp != null) {
                    upvoteRepository.delete(existingUp);
                    upvoteDelta = -1;
                    addReputation(comment.getUserId(), -REPUTATION_UPVOTE_RECEIVED);
                }
                if (existingDown != null) {
                    upvoteRepository.delete(existingDown);
                    downvoteDelta = -1;
                    addReputation(comment.getUserId(), -REPUTATION_DOWNVOTE_RECEIVED);
                    upvoteDelta = 1;
                    upvotedNow = true;
                    addReputation(comment.getUserId(), REPUTATION_UPVOTE_RECEIVED);
                } else if (existingUp == null) {
                    ForumUpvote vote = new ForumUpvote();
                    vote.setUserId(userId);
                    vote.setCommentId(commentId);
                    vote.setVoteType(ForumUpvote.VoteType.UP);
                    vote.setUpvoted(true);
                    upvoteRepository.save(vote);
                    upvoteDelta = 1;
                    upvotedNow = true;
                    addReputation(comment.getUserId(), REPUTATION_UPVOTE_RECEIVED);
                }
            } else {
                if (existingDown != null) {
                    upvoteRepository.delete(existingDown);
                    downvoteDelta = -1;
                    addReputation(comment.getUserId(), -REPUTATION_DOWNVOTE_RECEIVED);
                }
                if (existingUp != null) {
                    upvoteRepository.delete(existingUp);
                    upvoteDelta = -1;
                    addReputation(comment.getUserId(), -REPUTATION_UPVOTE_RECEIVED);
                    downvoteDelta = 1;
                    downvotedNow = true;
                    addReputation(comment.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
                } else if (existingDown == null) {
                    ForumUpvote vote = new ForumUpvote();
                    vote.setUserId(userId);
                    vote.setCommentId(commentId);
                    vote.setVoteType(ForumUpvote.VoteType.DOWN);
                    vote.setUpvoted(false);
                    upvoteRepository.save(vote);
                    downvoteDelta = 1;
                    downvotedNow = true;
                    addReputation(comment.getUserId(), REPUTATION_DOWNVOTE_RECEIVED);
                }
            }
        }

        comment.setUpvoteCount(Math.max(0, comment.getUpvoteCount() + upvoteDelta - downvoteDelta));
        commentRepository.save(comment);

        Map<String, Object> result = new HashMap<>();
        result.put("upvoteCount", comment.getUpvoteCount());
        result.put("upvoted", upvotedNow);
        result.put("downvoted", downvotedNow);
        result.put("voteType", upvotedNow ? "up" : (downvotedNow ? "down" : "none"));
        return result;
    }

    // ─── Comments ─────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getComments(Long postId) {
        return getComments(postId, "score");
    }

    public List<Map<String, Object>> getComments(Long postId, String sort) {
        List<ForumComment> comments;
        if ("score".equalsIgnoreCase(sort)) {
            comments = commentRepository.findByPostIdOrderByUpvoteCountDesc(postId);
            // Put accepted answer first
            comments.sort((a, b) -> {
                if (a.isAccepted() && !b.isAccepted()) return -1;
                if (!a.isAccepted() && b.isAccepted()) return 1;
                return Integer.compare(b.getUpvoteCount(), a.getUpvoteCount());
            });
        } else {
            comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        }
        return enrichComments(comments);
    }

    @Transactional
    public ForumComment addComment(Long userId, Long postId, String content) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null) return null;

        ForumComment comment = new ForumComment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(content);
        ForumComment saved = commentRepository.save(comment);

        post.setCommentCount(commentRepository.countByPostId(postId));
        postRepository.save(post);

        userRepository.findById(userId).ifPresent(user -> {
            user.setForumAnswers(user.getForumAnswers() + 1);
            userRepository.save(user);
        });

        return saved;
    }

    @Transactional
    public boolean deleteComment(Long commentId, Long userId) {
        ForumComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !comment.getUserId().equals(userId)) return false;
        upvoteRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);

        ForumPost post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(commentRepository.countByPostId(post.getId()));
            postRepository.save(post);
        }
        return true;
    }

    @Transactional
    public boolean acceptAnswer(Long postId, Long commentId, Long userId) {
        ForumPost post = postRepository.findById(postId).orElse(null);
        if (post == null || !post.getUserId().equals(userId)) return false;

        ForumComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !comment.getPostId().equals(postId)) return false;

        if (post.getAcceptedCommentId() != null) {
            ForumComment prev = commentRepository.findById(post.getAcceptedCommentId()).orElse(null);
            if (prev != null) {
                prev.setAccepted(false);
                commentRepository.save(prev);
                removeReputation(prev.getUserId(), REPUTATION_ANSWER_ACCEPTED);
            }
        }

        comment.setAccepted(true);
        commentRepository.save(comment);

        post.setAcceptedCommentId(commentId);
        post.setSolved(true);
        postRepository.save(post);

        addReputation(comment.getUserId(), REPUTATION_ANSWER_ACCEPTED);
        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            user.setAcceptedAnswers(user.getAcceptedAnswers() + 1);
            userRepository.save(user);
        });

        return true;
    }

    // ─── Reputation helpers ───────────────────────────────────────────────────────

    private void addReputation(Long userId, int delta) {
        if (userId == null || delta == 0) return;
        userRepository.findById(userId).ifPresent(user -> {
            user.setForumReputation(Math.max(0, user.getForumReputation() + delta));
            userRepository.save(user);
        });
    }

    private void removeReputation(Long userId, int delta) {
        addReputation(userId, -delta);
    }

    // ─── Enrich helpers ────────────────────────────────────────────────────────────

    private List<Map<String, Object>> enrichPosts(List<ForumPost> posts, Long currentUserId) {
        if (posts.isEmpty()) return List.of();

        Set<Long> userIds = posts.stream()
                .map(ForumPost::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        return posts.stream().map(p -> enrichPost(p, userMap)).toList();
    }

    private Map<String, Object> enrichPost(ForumPost post, Long currentUserId) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("tags", post.getTags());
        map.put("viewCount", post.getViewCount());
        map.put("upvoteCount", post.getUpvoteCount());
        map.put("commentCount", post.getCommentCount());
        map.put("solved", post.isSolved());
        map.put("acceptedCommentId", post.getAcceptedCommentId());
        map.put("createdAt", post.getCreatedAt() != null ? post.getCreatedAt().toString() : null);
        map.put("updatedAt", post.getUpdatedAt() != null ? post.getUpdatedAt().toString() : null);

        if (post.getUserId() != null) {
            userRepository.findById(post.getUserId()).ifPresent(u -> {
                map.put("authorName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                map.put("authorUsername", u.getUsername());
                map.put("authorAvatar", u.getAvatarUrl());
                map.put("authorReputation", u.getForumReputation());
            });
        }

        if (currentUserId != null) {
            List<ForumUpvote> userVotes = upvoteRepository.findAllByUserIdAndPostId(currentUserId, post.getId());
            ForumUpvote upVote = userVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.UP).findFirst().orElse(null);
            ForumUpvote downVote = userVotes.stream()
                    .filter(v -> v.getVoteType() == ForumUpvote.VoteType.DOWN).findFirst().orElse(null);
            map.put("userUpvoted", upVote != null);
            map.put("userDownvoted", downVote != null);
        }

        return map;
    }

    private Map<String, Object> enrichPost(ForumPost post, Map<Long, User> userMap) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("tags", post.getTags());
        map.put("viewCount", post.getViewCount());
        map.put("upvoteCount", post.getUpvoteCount());
        map.put("commentCount", post.getCommentCount());
        map.put("solved", post.isSolved());
        map.put("acceptedCommentId", post.getAcceptedCommentId());
        map.put("createdAt", post.getCreatedAt() != null ? post.getCreatedAt().toString() : null);
        map.put("updatedAt", post.getUpdatedAt() != null ? post.getUpdatedAt().toString() : null);

        if (post.getUserId() != null && userMap != null) {
            User u = userMap.get(post.getUserId());
            if (u != null) {
                map.put("authorName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                map.put("authorUsername", u.getUsername());
                map.put("authorAvatar", u.getAvatarUrl());
                map.put("authorReputation", u.getForumReputation());
            }
        }
        return map;
    }

    private List<Map<String, Object>> enrichComments(List<ForumComment> comments) {
        if (comments.isEmpty()) return List.of();

        Set<Long> userIds = comments.stream()
                .map(ForumComment::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        return comments.stream().map(c -> enrichComment(c, userMap)).toList();
    }

    private Map<String, Object> enrichComment(ForumComment comment, Map<Long, User> userMap) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", comment.getId());
        map.put("postId", comment.getPostId());
        map.put("content", comment.getContent());
        map.put("upvoteCount", comment.getUpvoteCount());
        map.put("accepted", comment.isAccepted());
        map.put("createdAt", comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null);

        if (comment.getUserId() != null && userMap != null) {
            User u = userMap.get(comment.getUserId());
            if (u != null) {
                map.put("authorName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                map.put("authorUsername", u.getUsername());
                map.put("authorAvatar", u.getAvatarUrl());
                map.put("authorReputation", u.getForumReputation());
            }
        }
        return map;
    }
}
