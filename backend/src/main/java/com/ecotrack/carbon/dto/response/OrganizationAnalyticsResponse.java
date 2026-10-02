package com.ecotrack.carbon.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class OrganizationAnalyticsResponse {
    private Long organizationId;
    private String organizationName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long totalMembers;
    private Long activeMembers;
    private Long pendingMembers;
    private BigDecimal totalCO2e;
    private BigDecimal averageCO2e;
    private Long totalActivities;
    private Map<String, BigDecimal> categoryBreakdown;
    private List<TimeSeriesData> trendData;

    @Data
    public static class TimeSeriesData {
        private String period;
        private BigDecimal totalCO2e;
        private Long activityCount;
        private Map<String, BigDecimal> categories;
    }
}