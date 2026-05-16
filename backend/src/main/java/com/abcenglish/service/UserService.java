package com.abcenglish.service;

import com.abcenglish.dto.UserDTO;
import com.abcenglish.entity.User;
import com.abcenglish.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO getUserById(Long id) {
        return userRepository.findById(id).map(UserDTO::fromEntity).orElse(null);
    }

    public UserDTO getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(UserDTO::fromEntity).orElse(null);
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDTO> result = new ArrayList<UserDTO>();
        for (User user : users) {
            result.add(UserDTO.fromEntity(user));
        }
        return result;
    }

    public List<UserDTO> getUsersByRole(String role) {
        try {
            List<User> users = userRepository.findByRole(User.Role.valueOf(role.toUpperCase()));
            List<UserDTO> result = new ArrayList<UserDTO>();
            for (User user : users) {
                result.add(UserDTO.fromEntity(user));
            }
            return result;
        } catch (Exception e) {
            return new ArrayList<UserDTO>();
        }
    }

    public UserDTO updateProfile(Long id, Map<String, Object> updates) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return null;

        User user = opt.get();
        if (updates.containsKey("fullName")) user.setFullName((String) updates.get("fullName"));
        if (updates.containsKey("avatarUrl")) user.setAvatarUrl((String) updates.get("avatarUrl"));
        if (updates.containsKey("level")) {
            try { user.setLevel(User.Level.valueOf((String) updates.get("level"))); } catch (Exception ignored) {}
        }
        if (updates.containsKey("ageGroup")) {
            try { user.setAgeGroup(User.AgeGroup.valueOf((String) updates.get("ageGroup"))); } catch (Exception ignored) {}
        }

        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    public boolean changePassword(Long id, String oldPassword, String newPassword) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return false;

        User user = opt.get();
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) return false;

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }
}
