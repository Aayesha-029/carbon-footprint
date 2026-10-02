package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data  // Add this
public class GoalResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String goalName;
    private String category;
    private BigDecimal targetCO2;
    private BigDecimal currentCO2;
    private BigDecimal remainingCO2;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String statusMessage;
    private String statusColor;
    private BigDecimal progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}