package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DashboardStatsResponse {
    private UserInfo userInfo;
    private SummaryStats summary;
    private List<CategoryData> categoryBreakdown;
    private List<RecentActivity> recentActivities;
    private List<QuickTip> tips;
    
    @Data
    public static class UserInfo {
        private Long userId;
        private String fullName;
        private String email;
        private String role;
    }
    
    @Data
    public static class SummaryStats {
        private BigDecimal todayFootprint;
        private Integer weeklyGoalProgress;
        private BigDecimal monthlyTarget;
        private Integer monthlyGoal;
        private Integer carbonScore;
        private String scoreLabel;
        private String scoreEmoji;
    }
    
    @Data
    public static class CategoryData {
        private String name;
        private BigDecimal value;
        private String color;
        private Integer percentage;
    }
    
    @Data
    public static class RecentActivity {
        private Long id;
        private String category;
        private String activityType;
        private BigDecimal co2eKg;
        private String logDate;
    }
    
    @Data
    public static class QuickTip {
        private String icon;
        private String tip;
    }
}