package com.ecotrack.carbon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "goal_name", nullable = false, length = 100)
    private String goalName;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "target_co2", nullable = false, precision = 14, scale = 4)
    private BigDecimal targetCO2;

    @Column(name = "current_co2", precision = 14, scale = 4)
    private BigDecimal currentCO2 = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED";

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ============ GETTERS ============
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getGoalName() { return goalName; }
    public String getCategory() { return category; }
    public BigDecimal getTargetCO2() { return targetCO2; }
    public BigDecimal getCurrentCO2() { return currentCO2; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStatus() { return status; }
    public BigDecimal getProgressPercentage() { return progressPercentage; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ============ SETTERS ============
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setGoalName(String goalName) { this.goalName = goalName; }
    public void setCategory(String category) { this.category = category; }
    public void setTargetCO2(BigDecimal targetCO2) { this.targetCO2 = targetCO2; }
    public void setCurrentCO2(BigDecimal currentCO2) { this.currentCO2 = currentCO2; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setStatus(String status) { this.status = status; }
    public void setProgressPercentage(BigDecimal progressPercentage) { this.progressPercentage = progressPercentage; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}