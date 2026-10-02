package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class AnalyticsResponse {
    private Long userId;
    private String userName;
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Summary stats
    private BigDecimal totalCO2e;
    private Long totalActivities;
    private BigDecimal averageDailyCO2e;
    
    // Category breakdown
    private Map<String, CategoryStats> categoryBreakdown;
    
    // Daily/weekly/monthly trends
    private List<TimeSeriesData> trendData;
    
    @Data
    public static class CategoryStats {
        private BigDecimal totalCO2e;
        private Long count;
        private BigDecimal averagePerActivity;
        private String color;
    }
    
    @Data
    public static class TimeSeriesData {
        private String period;
        private BigDecimal totalCO2e;
        private Long activityCount;
        private Map<String, BigDecimal> categories;
    }
}