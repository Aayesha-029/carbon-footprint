package com.ecotrack.carbon.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(length = 500)
    private String bio;

    @Column(name = "preferred_units", length = 20)
    private String preferredUnits = "METRIC";

    @Column(name = "diet_type", length = 20)
    private String dietType = "OMNIVORE";

    @Column(name = "primary_transport_mode", length = 20)
    private String primaryTransportMode = "CAR";

    @Column(name = "energy_source", length = 20)
    private String energySource = "GRID";

    @Column(name = "notifications_enabled")
    private boolean notificationsEnabled = true;

    @Column(name = "theme", length = 20)
    private String theme = "light";

    @Column(name = "language", length = 10)
    private String language = "en";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ============ GETTERS ============
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getBio() { return bio; }
    public String getPreferredUnits() { return preferredUnits; }
    public String getDietType() { return dietType; }
    public String getPrimaryTransportMode() { return primaryTransportMode; }
    public String getEnergySource() { return energySource; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public String getTheme() { return theme; }
    public String getLanguage() { return language; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ============ SETTERS ============
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setBio(String bio) { this.bio = bio; }
    public void setPreferredUnits(String preferredUnits) { this.preferredUnits = preferredUnits; }
    public void setDietType(String dietType) { this.dietType = dietType; }
    public void setPrimaryTransportMode(String primaryTransportMode) { this.primaryTransportMode = primaryTransportMode; }
    public void setEnergySource(String energySource) { this.energySource = energySource; }
    public void setNotificationsEnabled(boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }
    public void setTheme(String theme) { this.theme = theme; }
    public void setLanguage(String language) { this.language = language; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}