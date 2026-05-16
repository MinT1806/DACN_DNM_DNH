package com.abcenglish.service;

import com.abcenglish.entity.ForumPost;
import com.abcenglish.entity.ForumComment;
import com.abcenglish.entity.ForumUpvote;
import com.abcenglish.entity.User;
import com.abcenglish.repository.ForumPostRepository;
import com.abcenglish.repository.ForumCommentRepository;
import com.abcenglish.repository.ForumUpvoteRepository;
import com.abcenglish.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ForumService.
 * Tests forum post CRUD, comments, upvotes.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ForumServiceTest {

    @Mock private ForumPostRepository postRepository;
    @Mock private ForumCommentRepository commentRepository;
    @Mock private ForumUpvoteRepository upvoteRepository;
    @Mock private UserRepository userRepository;

    private ForumService forumService;

    private User testUser;
    private ForumPost testPost;
    private ForumComment testComment;

    @BeforeEach
    void setUp() {
        forumService = new ForumService(postRepository, commentRepository, upvoteRepository, userRepository);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setFullName("Test User");

        testPost = new ForumPost();
        testPost.setId(1L);
        testPost.setUserId(1L);
        testPost.setTitle("Test Post");
        testPost.setContent("Test content");
        testPost.setUpvoteCount(5);
        testPost.setCommentCount(2);
        testPost.setViewCount(10);

        testComment = new ForumComment();
        testComment.setId(1L);
        testComment.setPostId(1L);
        testComment.setUserId(1L);
        testComment.setContent("Test comment");
        testComment.setUpvoteCount(0);
    }

    // ─── Post Retrieval Tests ─────────────────────────────────────────────────

    @Test
    void getPosts_newestSort_shouldReturnSortedByCreatedAt() {
        when(postRepository.findByOrderByCreatedAtDesc(any(PageRequest.class)))
            .thenReturn(List.of(testPost));

        List<Map<String, Object>> result = forumService.getPosts("newest", 0, 20);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Post", result.get(0).get("title"));
    }

    @Test
    void getPosts_popularSort_shouldReturnSortedByUpvotes() {
        when(postRepository.findByOrderByUpvoteCountDesc(any(PageRequest.class)))
            .thenReturn(List.of(testPost));

        List<Map<String, Object>> result = forumService.getPosts("popular", 0, 20);

        assertNotNull(result);
        verify(postRepository).findByOrderByUpvoteCountDesc(any(PageRequest.class));
        verify(postRepository, never()).findByOrderByCreatedAtDesc(any(PageRequest.class));
    }

    @Test
    void getPostById_existingPost_shouldIncrementViewCount() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(upvoteRepository.existsByUserIdAndPostId(any(), anyLong())).thenReturn(false);

        Map<String, Object> result = forumService.getPostById(1L, null);

        assertNotNull(result);
        assertEquals(11, result.get("viewCount")); // Incremented from 10
        verify(postRepository).save(testPost);
    }

    @Test
    void getPostById_nonexistentPost_shouldReturnNull() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> result = forumService.getPostById(999L, null);

        assertNull(result);
        verify(postRepository, never()).save(any());
    }

    @Test
    void getPostById_withCurrentUser_shouldShowVotedStatus() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(upvoteRepository.existsByUserIdAndPostId(5L, 1L)).thenReturn(true);

        Map<String, Object> result = forumService.getPostById(1L, 5L);

        assertTrue((Boolean) result.get("userVoted"));
    }

    @Test
    void getPostById_withoutAuth_shouldReturnUserVotedFalse() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(upvoteRepository.existsByUserIdAndPostId(any(), anyLong())).thenReturn(false);

        Map<String, Object> result = forumService.getPostById(1L, null);

        assertFalse((Boolean) result.get("userVoted"));
    }

    // ─── Post Creation Tests ───────────────────────────────────────────────────

    @Test
    void createPost_withValidData_shouldSavePost() {
        when(postRepository.save(any(ForumPost.class))).thenAnswer(inv -> {
            ForumPost p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        ForumPost result = forumService.createPost(1L, "New Title", "New Content", "grammar,vocab");

        assertNotNull(result);
        assertEquals("New Title", result.getTitle());
        assertEquals("New Content", result.getContent());
        assertEquals("grammar,vocab", result.getTags());
        assertEquals(1L, result.getUserId());
        verify(postRepository).save(any(ForumPost.class));
    }

    // ─── Post Update Tests ───────────────────────────────────────────────────

    @Test
    void updatePost_byOwner_shouldUpdateFields() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        ForumPost result = forumService.updatePost(1L, 1L, "Updated Title", "Updated Content", null);

        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        assertEquals("Updated Content", result.getContent());
    }

    @Test
    void updatePost_byNonOwner_shouldReturnNull() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));

        ForumPost result = forumService.updatePost(1L, 999L, "Hacked Title", "Hacked Content", null);

        assertNull(result);
        verify(postRepository, never()).save(any());
    }

    @Test
    void updatePost_nonexistentPost_shouldReturnNull() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        ForumPost result = forumService.updatePost(999L, 1L, "Title", "Content", null);

        assertNull(result);
    }

    // ─── Post Delete Tests ───────────────────────────────────────────────────

    @Test
    void deletePost_byOwner_shouldDeletePostAndComments() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.findByPostIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(testComment));
        when(commentRepository.countByPostId(1L)).thenReturn(0);

        boolean result = forumService.deletePost(1L, 1L);

        assertTrue(result);
        verify(upvoteRepository).deleteByCommentId(testComment.getId());
        verify(upvoteRepository).deleteByPostId(1L);
        verify(commentRepository).deleteAll(anyList());
        verify(postRepository).delete(testPost);
    }

    @Test
    void deletePost_byNonOwner_shouldReturnFalse() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));

        boolean result = forumService.deletePost(1L, 999L);

        assertFalse(result);
        verify(postRepository, never()).delete(any());
    }

    @Test
    void deletePost_nonexistent_shouldReturnFalse() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        boolean result = forumService.deletePost(999L, 1L);

        assertFalse(result);
    }

    // ─── Upvote Tests ────────────────────────────────────────────────────────

    @Test
    void togglePostUpvote_whenNotUpvoted_shouldAddUpvote() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(upvoteRepository.findAllByUserIdAndPostId(1L, 1L)).thenReturn(List.of());
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        Map<String, Object> result = forumService.togglePostUpvote(1L, 1L);

        assertNotNull(result);
        assertEquals(6, result.get("upvoteCount"));
        assertTrue((Boolean) result.get("upvoted"));
        verify(upvoteRepository).save(any(ForumUpvote.class));
    }

    @Test
    void togglePostUpvote_whenAlreadyUpvoted_shouldRemoveUpvote() {
        ForumUpvote existingVote = new ForumUpvote();
        existingVote.setUserId(1L);
        existingVote.setPostId(1L);
        existingVote.setVoteType(com.abcenglish.entity.ForumUpvote.VoteType.UP);

        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(upvoteRepository.findAllByUserIdAndPostId(1L, 1L)).thenReturn(List.of(existingVote));
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        Map<String, Object> result = forumService.togglePostUpvote(1L, 1L);

        assertNotNull(result);
        assertEquals(4, result.get("upvoteCount")); // 5 - 1
        assertFalse((Boolean) result.get("upvoted"));
        verify(upvoteRepository).delete(existingVote);
    }

    @Test
    void togglePostUpvote_onNonexistentPost_shouldReturnNull() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> result = forumService.togglePostUpvote(1L, 999L);

        assertNull(result);
    }

    // ─── Comment Tests ──────────────────────────────────────────────────────

    @Test
    void addComment_withValidPost_shouldCreateComment() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.save(any(ForumComment.class))).thenAnswer(inv -> {
            ForumComment c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });
        when(commentRepository.countByPostId(1L)).thenReturn(1);
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        ForumComment result = forumService.addComment(1L, 1L, "Great post!");

        assertNotNull(result);
        assertEquals("Great post!", result.getContent());
        assertEquals(1L, result.getUserId());
    }

    @Test
    void addComment_onNonexistentPost_shouldReturnNull() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        ForumComment result = forumService.addComment(1L, 999L, "Comment");

        assertNull(result);
    }

    @Test
    void getComments_shouldReturnEnrichedComments() {
        when(commentRepository.findByPostIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(testComment));
        when(userRepository.findAllById(Set.of(1L))).thenReturn(List.of(testUser));

        List<Map<String, Object>> result = forumService.getComments(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test comment", result.get(0).get("content"));
        assertEquals("Test User", result.get(0).get("authorName"));
    }

    @Test
    void deleteComment_byOwner_shouldDeleteComment() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.countByPostId(1L)).thenReturn(0);
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        boolean result = forumService.deleteComment(1L, 1L);

        assertTrue(result);
        verify(commentRepository).delete(testComment);
    }

    @Test
    void deleteComment_byNonOwner_shouldReturnFalse() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));

        boolean result = forumService.deleteComment(1L, 999L);

        assertFalse(result);
        verify(commentRepository, never()).delete(any());
    }

    // ─── Accept Answer Tests ─────────────────────────────────────────────────

    @Test
    void acceptAnswer_byPostOwner_shouldAcceptComment() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(commentRepository.save(any(ForumComment.class))).thenReturn(testComment);
        when(postRepository.save(any(ForumPost.class))).thenReturn(testPost);

        boolean result = forumService.acceptAnswer(1L, 1L, 1L);

        assertTrue(result);
        assertTrue(testPost.isSolved());
        assertEquals(1L, testPost.getAcceptedCommentId());
    }

    @Test
    void acceptAnswer_byNonOwner_shouldReturnFalse() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));

        boolean result = forumService.acceptAnswer(1L, 1L, 999L);

        assertFalse(result);
    }

    @Test
    void acceptAnswer_withInvalidComment_shouldReturnFalse() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        boolean result = forumService.acceptAnswer(1L, 999L, 1L);

        assertFalse(result);
    }
}
