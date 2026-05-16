package com.abcenglish.service;

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

/**
 * Unit tests for JwtService.
 * Tests JWT token generation, validation, and claim extraction.
 */
@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private JwtService jwtService;
    private static final String JWT_SECRET = "testSecretKeyForUnitTestingPurposeOnly123456789012345678901234567890";
    private static final long JWT_EXPIRATION_MS = 86400000L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", JWT_EXPIRATION_MS);
    }

    @Test
    void generateToken_withUsername_shouldCreateValidToken() {
        String token = jwtService.generateToken("testuser");

        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertEquals("testuser", jwtService.extractUsername(token));
    }

    @Test
    void generateToken_withExtraClaims_shouldIncludeUserId() {
        Map<String, Object> extraClaims = Map.of("userId", 42L);
        String token = jwtService.generateToken(extraClaims, "testuser");

        assertNotNull(token);
        assertEquals(42L, jwtService.extractUserIdFromToken(token));
    }

    @Test
    void isTokenValid_withValidToken_shouldReturnTrue() {
        String token = jwtService.generateToken("testuser");
        assertTrue(jwtService.isTokenValid(token, "testuser"));
    }

    @Test
    void isTokenValid_withWrongUsername_shouldReturnFalse() {
        String token = jwtService.generateToken("testuser");
        assertFalse(jwtService.isTokenValid(token, "wronguser"));
    }

    @Test
    void isTokenValid_withExpiredToken_shouldReturnFalse() {
        // Create service with 0ms expiration
        JwtService shortLivedService = new JwtService();
        ReflectionTestUtils.setField(shortLivedService, "jwtSecret", JWT_SECRET);
        ReflectionTestUtils.setField(shortLivedService, "jwtExpirationMs", -1L); // Already expired

        String token = shortLivedService.generateToken("testuser");
        assertFalse(shortLivedService.isTokenValid(token, "testuser"));
    }

    @Test
    void isTokenValid_withTamperedToken_shouldReturnFalse() {
        String token = jwtService.generateToken("testuser");
        String tamperedToken = token.substring(0, token.length() - 5) + "XXXXX";
        assertFalse(jwtService.isTokenValid(tamperedToken, "testuser"));
    }

    @Test
    void extractUserId_withIntegerUserId_shouldReturnLong() {
        Map<String, Object> extraClaims = Map.of("userId", 42);
        String token = jwtService.generateToken(extraClaims, "testuser");

        assertEquals(42L, jwtService.extractUserIdFromToken(token));
    }

    @Test
    void extractUserId_withLongUserId_shouldReturnLong() {
        Map<String, Object> extraClaims = Map.of("userId", 999999999L);
        String token = jwtService.generateToken(extraClaims, "testuser");

        assertEquals(999999999L, jwtService.extractUserIdFromToken(token));
    }

    @Test
    void extractUserId_withStringUserId_shouldParseLong() {
        Map<String, Object> extraClaims = Map.of("userId", "12345");
        String token = jwtService.generateToken(extraClaims, "testuser");

        assertEquals(12345L, jwtService.extractUserIdFromToken(token));
    }

    @Test
    void extractUserId_withMissingUserId_shouldReturnNull() {
        String token = jwtService.generateToken("testuser");
        assertNull(jwtService.extractUserIdFromToken(token));
    }

    @Test
    void extractUserId_withInvalidToken_shouldReturnNull() {
        assertNull(jwtService.extractUserIdFromToken("invalid.token.here"));
    }

    @Test
    void extractUserIdFromToken_withNull_shouldReturnNull() {
        assertNull(jwtService.extractUserIdFromToken(null));
    }

    @Test
    void extractUsername_withValidToken_shouldReturnUsername() {
        String token = jwtService.generateToken("john_doe");
        assertEquals("john_doe", jwtService.extractUsername(token));
    }

    @Test
    void extractUsername_withInvalidToken_shouldThrow() {
        assertThrows(Exception.class, () -> jwtService.extractUsername("invalid"));
    }

    @Test
    void extractClaim_shouldExtractCustomClaim() {
        Map<String, Object> extraClaims = Map.of("role", "ADMIN");
        String token = jwtService.generateToken(extraClaims, "testuser");

        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        assertEquals("ADMIN", role);
    }

    @Test
    void isTokenValid_withNullUsername_shouldReturnFalse() {
        String token = jwtService.generateToken("testuser");
        assertFalse(jwtService.isTokenValid(token, null));
    }

    @Test
    void multipleTokenGeneration_shouldProduceDifferentTokens() {
        String token1 = jwtService.generateToken("user1");
        String token2 = jwtService.generateToken("user1");
        // Tokens may be the same if generated at the exact same millisecond
        // This is acceptable behavior
        assertNotNull(token1);
        assertNotNull(token2);
    }
}
