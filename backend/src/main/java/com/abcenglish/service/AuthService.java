package com.abcenglish.service;

import com.abcenglish.dto.AuthRequest;
import com.abcenglish.dto.AuthResponse;
import com.abcenglish.dto.RegisterRequest;
import com.abcenglish.entity.User;
import com.abcenglish.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public Map<String, Object> register(RegisterRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            result.put("success", false);
            result.put("message", "Username is required");
            return result;
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            result.put("success", false);
            result.put("message", "Password is required");
            return result;
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            result.put("success", false);
            result.put("message", "Email is required");
            return result;
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            result.put("success", false);
            result.put("message", "Username already exists");
            return result;
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            result.put("success", false);
            result.put("message", "Email already exists");
            return result;
        }

        User user = new User(request.getUsername(), request.getEmail(),
                passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(User.Role.STUDENT);
        user.setLevel(User.Level.A1);
        user.setEnabled(true);

        if (request.getAgeGroup() != null) {
            try { user.setAgeGroup(User.AgeGroup.valueOf(request.getAgeGroup())); } catch (Exception ignored) {}
        }
        if (request.getLevel() != null) {
            try { user.setLevel(User.Level.valueOf(request.getLevel())); } catch (Exception ignored) {}
        }

        userRepository.save(user);

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        String token = jwtService.generateToken(extraClaims, user.getUsername());
        AuthResponse authResponse = new AuthResponse(
                token, user.getId(), user.getUsername(),
                user.getEmail(), user.getRole().name(), user.getFullName()
        );

        result.put("success", true);
        result.put("message", "Registration successful");
        result.put("data", authResponse);
        return result;
    }

    public Map<String, Object> login(AuthRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();

        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            result.put("success", false);
            result.put("message", "Invalid username or password");
            return result;
        }

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        String token = jwtService.generateToken(extraClaims, user.getUsername());
        AuthResponse authResponse = new AuthResponse(
                token, user.getId(), user.getUsername(),
                user.getEmail(), user.getRole().name(), user.getFullName()
        );

        result.put("success", true);
        result.put("message", "Login successful");
        result.put("data", authResponse);
        return result;
    }
}
