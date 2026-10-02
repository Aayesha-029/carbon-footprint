package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.OrganizationAnalyticsResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.entity.OrganizationMember;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.OrganizationMemberRepository;
import com.ecotrack.carbon.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationAnalyticsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final ActivityLogRepository activityLogRepository;

    private static final Map<String, String> CATEGORY_COLORS = new HashMap<>();
    static {
        CATEGORY_COLORS.put("Transport", "#22c55e");
        CATEGORY_COLORS.put("Electricity", "#3b82f6");
        CATEGORY_COLORS.put("Food", "#f59e0b");
        CATEGORY_COLORS.put("Shopping", "#8b5cf6");
    }

    public OrganizationAnalyticsResponse getAnalytics(Long orgId, LocalDate startDate, LocalDate endDate) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Get all active members
        List<OrganizationMember> members = memberRepository.findByOrganizationId(orgId);
        List<Long> userIds = members.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());

        OrganizationAnalyticsResponse response = new OrganizationAnalyticsResponse();
        response.setOrganizationId(orgId);
        response.setOrganizationName(org.getName());
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        // Total members, active, pending
        response.setTotalMembers((long) members.size());
        long activeCount = members.stream().filter(m -> "ACTIVE".equals(m.getStatus())).count();
        long pendingCount = members.stream().filter(m -> "PENDING".equals(m.getStatus())).count();
        response.setActiveMembers(activeCount);
        response.setPendingMembers(pendingCount);

        if (userIds.isEmpty()) {
            response.setTotalCO2e(BigDecimal.ZERO);
            response.setAverageCO2e(BigDecimal.ZERO);
            response.setTotalActivities(0L);
            response.setCategoryBreakdown(new HashMap<>());
            response.setTrendData(new ArrayList<>());
            return response;
        }

        // Fetch all activities for these users within date range
        List<ActivityLog> activities = activityLogRepository.findByUserIdInAndLogDateBetween(userIds, startDate, endDate);
        response.setTotalActivities((long) activities.size());

        // Total CO2
        BigDecimal totalCO2 = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setTotalCO2e(totalCO2.setScale(2, RoundingMode.HALF_UP));

        // Average per member
        BigDecimal avg = activeCount > 0 ? totalCO2.divide(BigDecimal.valueOf(activeCount), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        response.setAverageCO2e(avg.setScale(2, RoundingMode.HALF_UP));

        // Category breakdown
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        for (ActivityLog log : activities) {
            categoryBreakdown.merge(log.getCategory(), log.getCo2eKg(), BigDecimal::add);
        }
        categoryBreakdown = categoryBreakdown.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().setScale(2, RoundingMode.HALF_UP)));
        response.setCategoryBreakdown(categoryBreakdown);

        // Trend data (daily)
        List<OrganizationAnalyticsResponse.TimeSeriesData> trendData = new ArrayList<>();
        LocalDate current = startDate;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        while (!current.isAfter(endDate)) {
            OrganizationAnalyticsResponse.TimeSeriesData data = new OrganizationAnalyticsResponse.TimeSeriesData();
            data.setPeriod(current.format(formatter));

            LocalDate finalCurrent = current;
            List<ActivityLog> dayActivities = activities.stream()
                    .filter(a -> a.getLogDate().equals(finalCurrent))
                    .collect(Collectors.toList());

            BigDecimal dayTotal = dayActivities.stream()
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            data.setTotalCO2e(dayTotal.setScale(2, RoundingMode.HALF_UP));
            data.setActivityCount((long) dayActivities.size());

            Map<String, BigDecimal> catTotals = new HashMap<>();
            for (ActivityLog log : dayActivities) {
                catTotals.merge(log.getCategory(), log.getCo2eKg(), BigDecimal::add);
            }
            catTotals = catTotals.entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().setScale(2, RoundingMode.HALF_UP)));
            data.setCategories(catTotals);

            trendData.add(data);
            current = current.plusDays(1);
        }
        response.setTrendData(trendData);

        return response;
    }
}