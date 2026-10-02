package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class OrganizationDashboardResponse {
    private Long organizationId;
    private String organizationName;
    private Long totalMembers;
    private Long activeMembers;
    private Long pendingInvitations;
    private Long todayActivities;
    private BigDecimal todayCO2;
    private BigDecimal totalCO2;
    private Map<String, BigDecimal> categoryBreakdown;
    private List<TrendPoint> trendData;
    private List<TopMember> topMembers;
    private Insights insights;

    @Data
    public static class TrendPoint {
        private String period;
        private BigDecimal totalCO2e;
        private Long activityCount;
    }

    @Data
    public static class TopMember {
        private Long userId;
        private String name;
        private String email;
        private BigDecimal emission;
        private Long activityCount;
        private String topBadge;
    }

    @Data
    public static class Insights {
        private String bestPerformerName;
        private BigDecimal bestPerformerEmission;
        private String highestCategoryName;
        private BigDecimal highestCategoryEmission;
        private BigDecimal averageEmission;
        private BigDecimal totalEmission;
    }
}