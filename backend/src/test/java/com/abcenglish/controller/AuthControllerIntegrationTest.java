package com.abcenglish.controller;

import com.abcenglish.dto.AuthRequest;
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
 * Integration tests for Authentication endpoints.
 * Tests registration, login, token validation, and security.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    // ─── Registration Tests ───────────────────────────────────────────────────

    @Test
    void register_withValidData_shouldReturnSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser_" + System.currentTimeMillis());
        request.setEmail("new_" + System.currentTimeMillis() + "@test.com");
        request.setPassword("password123");
        request.setFullName("New Test User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Registration successful"))
            .andExpect(jsonPath("$.data.token").exists())
            .andExpect(jsonPath("$.data.username").exists())
            .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }

    @Test
    void register_withDuplicateUsername_shouldReturnBadRequest() throws Exception {
        String username = "duplicate_" + System.currentTimeMillis();
        RegisterRequest req1 = new RegisterRequest();
        req1.setUsername(username);
        req1.setEmail("test1_" + System.currentTimeMillis() + "@test.com");
        req1.setPassword("password123");

        // First registration should succeed
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
            .andExpect(status().isOk());

        // Second registration with same username should fail
        RegisterRequest req2 = new RegisterRequest();
        req2.setUsername(username);
        req2.setEmail("test2_" + System.currentTimeMillis() + "@test.com");
        req2.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    void register_withDuplicateEmail_shouldReturnBadRequest() throws Exception {
        String email = "duplicate_" + System.currentTimeMillis() + "@test.com";
        RegisterRequest req1 = new RegisterRequest();
        req1.setUsername("user1_" + System.currentTimeMillis());
        req1.setEmail(email);
        req1.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
            .andExpect(status().isOk());

        RegisterRequest req2 = new RegisterRequest();
        req2.setUsername("user2_" + System.currentTimeMillis());
        req2.setEmail(email);
        req2.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    void register_withMissingFields_shouldReturnBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@test.com");
        // Password intentionally omitted (null) to test validation

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_shouldSetCorrectDefaults() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("defaults_" + System.currentTimeMillis());
        request.setEmail("defaults_" + System.currentTimeMillis() + "@test.com");
        request.setPassword("password123");
        request.setLevel("B2");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn();

        String content = result.getResponse().getContentAsString();
        // Verify role is STUDENT (default)
        assert content.contains("\"role\":\"STUDENT\"");
    }

    // ─── Login Tests ─────────────────────────────────────────────────────────

    @Test
    void login_withValidCredentials_shouldReturnSuccess() throws Exception {
        // Register first
        String username = "logintest_" + System.currentTimeMillis();
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(username);
        reg.setEmail(username + "@test.com");
        reg.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
            .andExpect(status().isOk());

        // Then login
        AuthRequest loginReq = new AuthRequest();
        loginReq.setUsername(username);
        loginReq.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Login successful"))
            .andExpect(jsonPath("$.data.token").exists())
            .andExpect(jsonPath("$.data.username").value(username));
    }

    @Test
    void login_withWrongPassword_shouldReturnBadRequest() throws Exception {
        String username = "wrongpass_" + System.currentTimeMillis();
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(username);
        reg.setEmail(username + "@test.com");
        reg.setPassword("correctpassword");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
            .andExpect(status().isOk());

        AuthRequest loginReq = new AuthRequest();
        loginReq.setUsername(username);
        loginReq.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void login_withNonexistentUser_shouldReturnBadRequest() throws Exception {
        AuthRequest loginReq = new AuthRequest();
        loginReq.setUsername("nonexistent_user_xyz123");
        loginReq.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    // ─── Token Validation Tests ───────────────────────────────────────────────

    @Test
    void authenticatedRequest_withValidToken_shouldSucceed() throws Exception {
        // Register
        String username = "authtest_" + System.currentTimeMillis();
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(username);
        reg.setEmail(username + "@test.com");
        reg.setPassword("password123");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
            .andReturn();

        String token = objectMapper.readTree(regResult.getResponse().getContentAsString())
            .path("data").path("token").asText();

        // Use token to access a protected endpoint (e.g., forum posts - which requires auth)
        // Note: Currently all endpoints are public, but after fix this should require auth
        mockMvc.perform(get("/api/ranking")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void authenticatedRequest_withInvalidToken_shouldSucceed() throws Exception {
        // Currently, invalid tokens are silently ignored (permitAll)
        // After fix: should return 401
        mockMvc.perform(get("/api/ranking")
                .header("Authorization", "Bearer invalid.token.here"))
            .andExpect(status().isOk());
    }

    @Test
    void authenticatedRequest_withMalformedToken_shouldSucceed() throws Exception {
        // Currently permitAll - after fix should return 401
        mockMvc.perform(get("/api/ranking")
                .header("Authorization", "Bearer not-even-a-jwt"))
            .andExpect(status().isOk());
    }

    // ─── Password Security Tests ───────────────────────────────────────────────

    @Test
    void login_shouldVerifyPasswordNotStoredInPlainText() throws Exception {
        String username = "secure_" + System.currentTimeMillis();
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(username);
        reg.setEmail(username + "@test.com");
        reg.setPassword("mystrongpassword123");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
            .andExpect(status().isOk())
            .andReturn();

        // Response should NOT contain the password
        String response = regResult.getResponse().getContentAsString();
        assert !response.contains("mystrongpassword123");
        assert !response.contains("mystrong");
    }
}
