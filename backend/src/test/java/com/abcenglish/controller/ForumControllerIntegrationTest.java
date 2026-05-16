package com.abcenglish.controller;

import com.abcenglish.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Forum endpoints.
 * Tests forum post creation, comments, upvotes, and access control.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ForumControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String getStudentToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("forumuser_" + System.currentTimeMillis());
        request.setEmail("forum_" + System.currentTimeMillis() + "@test.com");
        request.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
            .path("data").path("token").asText();
    }

    // ─── Public Forum Endpoints ───────────────────────────────────────────

    @Test
    void getPosts_withoutAuth_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/forum/posts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getPosts_withSort_shouldReturnSortedList() throws Exception {
        mockMvc.perform(get("/api/forum/posts")
                .param("sort", "popular")
                .param("page", "0")
                .param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getPostById_withoutAuth_shouldReturnPost() throws Exception {
        String token = getStudentToken();

        // Create a post first
        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Test Post","content":"Test content for forum"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        // Get post without auth
        mockMvc.perform(get("/api/forum/posts/" + postId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("Test Post"));
    }

    @Test
    void getPostById_nonexistent_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/forum/posts/999999"))
            .andExpect(status().isNotFound());
    }

    // ─── Create Post (Requires Auth) ─────────────────────────────────────────

    @Test
    void createPost_withAuth_shouldSucceed() throws Exception {
        String token = getStudentToken();

        mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"My First Forum Post","content":"This is the content of my post","tags":"grammar,vocab"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").exists())
            .andExpect(jsonPath("$.data.title").value("My First Forum Post"));
    }

    @Test
    void createPost_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(post("/api/forum/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Unauthorized Post","content":"Should fail"}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void createPost_withEmptyTitle_shouldReturnBadRequest() throws Exception {
        String token = getStudentToken();

        mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"","content":"Content without title"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void createPost_withEmptyContent_shouldReturnBadRequest() throws Exception {
        String token = getStudentToken();

        mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Title Only"}
                    """))
            .andExpect(status().isBadRequest());
    }

    // ─── Update Post ──────────────────────────────────────────────────────────

    @Test
    void updatePost_byOwner_shouldSucceed() throws Exception {
        String token = getStudentToken();

        // Create post
        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Original Title","content":"Original content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        // Update post
        mockMvc.perform(put("/api/forum/posts/" + postId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Updated Title","content":"Updated content"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void updatePost_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(put("/api/forum/posts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Hacked Title"}
                    """))
            .andExpect(status().isForbidden());
    }

    // ─── Delete Post ─────────────────────────────────────────────────────────

    @Test
    void deletePost_byOwner_shouldSucceed() throws Exception {
        String token = getStudentToken();

        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post to Delete","content":"Will be deleted"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        mockMvc.perform(delete("/api/forum/posts/" + postId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deletePost_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(delete("/api/forum/posts/1"))
            .andExpect(status().isForbidden());
    }

    // ─── Upvotes ───────────────────────────────────────────────────────────

    @Test
    void togglePostUpvote_withAuth_shouldToggleVote() throws Exception {
        String token = getStudentToken();

        // Create post
        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post to Upvote","content":"Content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        // Upvote
        mockMvc.perform(post("/api/forum/posts/" + postId + "/upvote")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.upvoted").value(true));
    }

    @Test
    void togglePostUpvote_twice_shouldToggleOff() throws Exception {
        String token = getStudentToken();

        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post to Toggle","content":"Content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        // First upvote
        mockMvc.perform(post("/api/forum/posts/" + postId + "/upvote")
                .header("Authorization", "Bearer " + token))
            .andExpect(jsonPath("$.data.upvoted").value(true));

        // Second upvote (toggle off)
        mockMvc.perform(post("/api/forum/posts/" + postId + "/upvote")
                .header("Authorization", "Bearer " + token))
            .andExpect(jsonPath("$.data.upvoted").value(false));
    }

    @Test
    void togglePostUpvote_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(post("/api/forum/posts/1/upvote"))
            .andExpect(status().isForbidden());
    }

    // ─── Comments ───────────────────────────────────────────────────────────

    @Test
    void getComments_withoutAuth_shouldReturnList() throws Exception {
        // Create post with auth
        String token = getStudentToken();
        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post for Comments","content":"Content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        // Get comments without auth
        mockMvc.perform(get("/api/forum/posts/" + postId + "/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void addComment_withAuth_shouldSucceed() throws Exception {
        String token = getStudentToken();

        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post for Comment","content":"Content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        mockMvc.perform(post("/api/forum/posts/" + postId + "/comments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"content":"This is a great post!"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void addComment_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(post("/api/forum/posts/1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"content":"Unauthorized comment"}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void addComment_withEmptyContent_shouldReturnBadRequest() throws Exception {
        String token = getStudentToken();

        MvcResult createResult = mockMvc.perform(post("/api/forum/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Post","content":"Content"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        Long postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        mockMvc.perform(post("/api/forum/posts/" + postId + "/comments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"content":""}
                    """))
            .andExpect(status().isBadRequest());
    }
}
