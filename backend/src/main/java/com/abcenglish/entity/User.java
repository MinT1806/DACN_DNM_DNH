package com.abcenglish.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;

    @Enumerated(EnumType.STRING)
    private AgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private Level level;

    private String avatarUrl;

    private boolean enabled = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Forum reputation
    private Integer forumReputation = 0;
    private Integer forumPosts = 0;
    private Integer forumAnswers = 0;
    private Integer acceptedAnswers = 0;

    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.enabled = true;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public AgeGroup getAgeGroup() { return ageGroup; }
    public void setAgeGroup(AgeGroup ageGroup) { this.ageGroup = ageGroup; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public int getForumReputation() { return forumReputation != null ? forumReputation : 0; }
    public void setForumReputation(int forumReputation) { this.forumReputation = forumReputation; }
    public int getForumPosts() { return forumPosts != null ? forumPosts : 0; }
    public void setForumPosts(int forumPosts) { this.forumPosts = forumPosts; }
    public int getForumAnswers() { return forumAnswers != null ? forumAnswers : 0; }
    public void setForumAnswers(int forumAnswers) { this.forumAnswers = forumAnswers; }
    public int getAcceptedAnswers() { return acceptedAnswers != null ? acceptedAnswers : 0; }
    public void setAcceptedAnswers(int acceptedAnswers) { this.acceptedAnswers = acceptedAnswers; }

    public enum AgeGroup { KID, TEEN, ADULT }
    public enum Role { STUDENT, TEACHER, ADMIN }
    public enum Level { A1, A2, B1, B2, C1, C2 }
}
