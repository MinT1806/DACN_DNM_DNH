package com.abcenglish.dto;

import com.abcenglish.entity.User;

public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String ageGroup;
    private String role;
    private String level;
    private String avatarUrl;
    private boolean enabled;

    public UserDTO() {}

    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setAgeGroup(user.getAgeGroup() != null ? user.getAgeGroup().name() : null);
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setLevel(user.getLevel() != null ? user.getLevel().name() : null);
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setEnabled(user.isEnabled());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
