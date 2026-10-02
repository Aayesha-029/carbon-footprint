package com.ecotrack.carbon.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_type", nullable = false, length = 50)
    private String badgeType;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    // ============ GETTERS ============
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getBadgeType() { return badgeType; }
    public LocalDateTime getEarnedAt() { return earnedAt; }

    // ============ SETTERS ============
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setBadgeType(String badgeType) { this.badgeType = badgeType; }
    public void setEarnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; }
}