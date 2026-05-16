package com.abcenglish.service;

import com.abcenglish.dto.AuthRequest;
import com.abcenglish.dto.RegisterRequest;
import com.abcenglish.entity.User;
import com.abcenglish.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private JwtService jwtService;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret",
            "testSecretKeyForUnitTestingPurposeOnly123456789012345678901234567890");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 86400000L);
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void register_withValidData_shouldSucceed() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setFullName("New User");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        Map<String, Object> result = authService.register(request);

        assertTrue((Boolean) result.get("success"));
        assertEquals("Registration successful", result.get("message"));
        assertNotNull(result.get("data"));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_withDuplicateUsername_shouldFail() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setEmail("new@example.com");
        request.setPassword("password123");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        Map<String, Object> result = authService.register(request);

        assertFalse((Boolean) result.get("success"));
        assertEquals("Username already exists", result.get("message"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_withDuplicateEmail_shouldFail() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("existing@example.com");
        request.setPassword("password123");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        Map<String, Object> result = authService.register(request);

        assertFalse((Boolean) result.get("success"));
        assertEquals("Email already exists", result.get("message"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_shouldEncodePassword() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("rawpassword");
        request.setFullName("New User");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        authService.register(request);

        verify(userRepository).save(argThat(user ->
            user.getPassword() != null &&
            !user.getPassword().equals("rawpassword") &&
            passwordEncoder.matches("rawpassword", user.getPassword())
        ));
    }

    @Test
    void register_shouldSetDefaultRoleAndLevel() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        authService.register(request);

        verify(userRepository).save(argThat(user ->
            user.getRole() == User.Role.STUDENT &&
            user.getLevel() == User.Level.A1
        ));
    }

    @Test
    void login_withValidCredentials_shouldSucceed() {
        AuthRequest request = new AuthRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        String encoded = passwordEncoder.encode("password123");
        User user = new User("testuser", "test@example.com", encoded);
        user.setId(1L);
        user.setFullName("Test User");
        user.setRole(User.Role.STUDENT);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        Map<String, Object> result = authService.login(request);

        assertTrue((Boolean) result.get("success"));
        assertEquals("Login successful", result.get("message"));
        assertNotNull(result.get("data"));
    }

    @Test
    void login_withInvalidUsername_shouldFail() {
        AuthRequest request = new AuthRequest();
        request.setUsername("nonexistent");
        request.setPassword("password123");

        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        Map<String, Object> result = authService.login(request);

        assertFalse((Boolean) result.get("success"));
        assertEquals("Invalid username or password", result.get("message"));
    }

    @Test
    void login_withWrongPassword_shouldFail() {
        AuthRequest request = new AuthRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        String encoded = passwordEncoder.encode("correctpassword");
        User user = new User("testuser", "test@example.com", encoded);
        user.setId(1L);
        user.setRole(User.Role.STUDENT);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        Map<String, Object> result = authService.login(request);

        assertFalse((Boolean) result.get("success"));
        assertEquals("Invalid username or password", result.get("message"));
    }

    @Test
    void register_shouldParseLevelFromRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setLevel("B2");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        authService.register(request);

        verify(userRepository).save(argThat(user -> user.getLevel() == User.Level.B2));
    }
}
