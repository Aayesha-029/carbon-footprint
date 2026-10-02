package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class LeaderboardEntry {
    private Long userId;
    private String userName;
    private BigDecimal totalCO2e;
    private Long activityCount;
    private Integer rank;
    private List<String> badges;
    private String topCategory;
    private BigDecimal categoryScore;
}