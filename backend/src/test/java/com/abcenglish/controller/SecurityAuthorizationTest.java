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
 * Security authorization tests.
 * Tests whether role-based access control (RBAC) is properly enforced.
 * All BUG tests now verify the CORRECT behavior after fixes were applied.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAuthorizationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String registerStudentAndGetToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("student" + System.currentTimeMillis());
        request.setEmail("student" + System.currentTimeMillis() + "@test.com");
        request.setPassword("password123");
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
            .path("data").path("token").asText();
    }

    // ─── FIXED B1: Admin endpoints require authentication ───────────────────────

    @Test
    void adminStats_withoutAuth_shouldBeForbidden() throws Exception {
        // FIXED: Admin endpoint now requires authentication
        mockMvc.perform(get("/api/admin/stats"))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminUsers_withoutAuth_shouldBeForbidden() throws Exception {
        // FIXED: Admin endpoint now requires authentication
        mockMvc.perform(get("/api/admin/users"))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminAnalytics_withoutAuth_shouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/analytics"))
            .andExpect(status().isForbidden());
    }

    @Test
    void teacherLessons_withoutAuth_shouldBeForbidden() throws Exception {
        // Teacher endpoint requires authentication - Spring Security returns 403
        mockMvc.perform(get("/api/teacher/submissions"))
            .andExpect(status().isForbidden());
    }

    @Test
    void leaderboard_withoutAuth_shouldSucceed() throws Exception {
        // This is OK - leaderboard is intentionally public
        mockMvc.perform(get("/api/ranking"))
            .andExpect(status().isOk());
    }

    // ─── FIXED B2: Student cannot call Admin endpoints ───────────────────────────

    @Test
    void studentCannotAccessAdminStats() throws Exception {
        String studentToken = registerStudentAndGetToken();

        // FIXED: A student (not admin) should be forbidden from admin stats
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void studentCannotAccessAdminUsers() throws Exception {
        String studentToken = registerStudentAndGetToken();

        // FIXED: A student should be forbidden from admin user management
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void studentCannotUpdateUserRole() throws Exception {
        String studentToken = registerStudentAndGetToken();

        String body = "{\"role\": \"ADMIN\"}";

        // FIXED: A student cannot promote themselves to admin
        mockMvc.perform(put("/api/admin/users/1/role")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isForbidden());
    }

    @Test
    void studentCannotDeleteUsers() throws Exception {
        String studentToken = registerStudentAndGetToken();

        // FIXED: A student cannot delete users
        mockMvc.perform(delete("/api/admin/users/1")
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void studentCannotAccessTeacherSubmissions() throws Exception {
        String studentToken = registerStudentAndGetToken();

        // FIXED: A student cannot access teacher-only submissions page
        mockMvc.perform(get("/api/teacher/submissions")
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isForbidden());
    }

    // ─── Role escalation tests ─────────────────────────────────────────────────

    @Test
    void studentCannotUpdateRoleViaUserEndpoint() throws Exception {
        String studentToken = registerStudentAndGetToken();

        MvcResult profileResult = mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + studentToken))
            .andReturn();

        Long userId = objectMapper.readTree(profileResult.getResponse().getContentAsString())
            .path("data").path("id").asLong();

        String body = "{\"role\": \"ADMIN\"}";
        // FIXED: Cannot escalate role without admin privileges
        mockMvc.perform(put("/api/admin/users/" + userId + "/role")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isForbidden());
    }

    // ─── Public data access ───────────────────────────────────────────────────

    @Test
    void publicCourses_withoutAuth_shouldSucceed() throws Exception {
        mockMvc.perform(get("/api/courses"))
            .andExpect(status().isOk());
    }

    @Test
    void forumPosts_withoutAuth_shouldSucceed() throws Exception {
        mockMvc.perform(get("/api/forum/posts"))
            .andExpect(status().isOk());
    }
}
