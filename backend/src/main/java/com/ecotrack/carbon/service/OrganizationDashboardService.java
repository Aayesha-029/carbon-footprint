package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.OrganizationDashboardResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Badge;
import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.entity.OrganizationMember;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.BadgeRepository;
import com.ecotrack.carbon.repository.OrganizationInvitationRepository;
import com.ecotrack.carbon.repository.OrganizationMemberRepository;
import com.ecotrack.carbon.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationDashboardService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final OrganizationInvitationRepository invitationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BadgeRepository badgeRepository;

    @Transactional(readOnly = true)
    public OrganizationDashboardResponse getDashboard(Long orgId, String range) {
        long start = System.currentTimeMillis();

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Fetch all members in ONE query with user eagerly loaded (no N+1)
              // Fetch all members in ONE query with user eagerly loaded (no N+1)
        Long organizerId = org.getOrganizer() != null ? org.getOrganizer().getId() : null;

        // Exclude the organizer from the employee list (safety filter)
        List<OrganizationMember> members = memberRepository.findByOrganizationIdWithUser(orgId)
                .stream()
                .filter(m -> organizerId == null || !m.getUser().getId().equals(organizerId))
                .collect(Collectors.toList());

        List<OrganizationMember> activeMembers = members.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .collect(Collectors.toList());
        List<Long> activeUserIds = activeMembers.stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());

        // Pending invitations — single query
        long pendingInv = invitationRepository.findByOrganizationId(orgId).stream()
                .filter(inv -> "PENDING".equals(inv.getStatus()))
                .count();

        OrganizationDashboardResponse response = new OrganizationDashboardResponse();
        response.setOrganizationId(orgId);
        response.setOrganizationName(org.getName());
        response.setTotalMembers((long) members.size());
        response.setActiveMembers((long) activeMembers.size());
        response.setPendingInvitations(pendingInv);

        // Empty state
        if (activeUserIds.isEmpty()) {
            response.setTodayActivities(0L);
            response.setTodayCO2(BigDecimal.ZERO);
            response.setTotalCO2(BigDecimal.ZERO);
            response.setCategoryBreakdown(emptyCategoryMap());
            response.setTrendData(new ArrayList<>());
            response.setTopMembers(new ArrayList<>());
            response.setInsights(emptyInsights());
            log.info("Dashboard loaded in {} ms (empty)", System.currentTimeMillis() - start);
            return response;
        }

        // Date range
        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate = today;
        String r = range == null ? "daily" : range.toLowerCase();
        switch (r) {
            case "weekly":  startDate = today.minusWeeks(4); break;
            case "monthly": startDate = today.minusMonths(6); break;
            case "yearly":  startDate = today.minusYears(3); break;
            default:        startDate = today.minusDays(6); break;
        }

        // Fetch activities in ONE query
        List<ActivityLog> activities = activityLogRepository
                .findByUserIdInAndLogDateBetween(activeUserIds, startDate, endDate);

        // Fetch badges in ONE query (fixes N+1)
        List<Badge> allBadges = badgeRepository.findByUserIdIn(activeUserIds);
        Map<Long, String> userTopBadge = new HashMap<>();
        for (Badge b : allBadges) {
            Long uid = b.getUser().getId();
            userTopBadge.putIfAbsent(uid, b.getBadgeType());
        }

        // Group activities by user (single pass)
        Map<Long, List<ActivityLog>> activitiesByUser = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId()));

        // Group activities by date (single pass)
        Map<LocalDate, List<ActivityLog>> activitiesByDate = activities.stream()
                .collect(Collectors.groupingBy(ActivityLog::getLogDate));

        // Today's activities
        List<ActivityLog> todayActs = activitiesByDate.getOrDefault(today, Collections.emptyList());
        response.setTodayActivities((long) todayActs.size());
        response.setTodayCO2(sumCO2(todayActs));

        // Total CO2
        BigDecimal totalCO2 = sumCO2(activities);
        response.setTotalCO2(totalCO2);

        // Category breakdown (single pass)
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        for (ActivityLog a : activities) {
            categoryBreakdown.merge(a.getCategory(), a.getCo2eKg(), BigDecimal::add);
        }
        for (String cat : Arrays.asList("Transport", "Electricity", "Food", "Shopping")) {
            categoryBreakdown.putIfAbsent(cat, BigDecimal.ZERO);
        }
        categoryBreakdown.replaceAll((k, v) -> v.setScale(2, RoundingMode.HALF_UP));
        response.setCategoryBreakdown(categoryBreakdown);

        // Trend (uses grouped data)
        response.setTrendData(buildTrend(activitiesByDate, r, startDate, endDate));

        // Top members (uses grouped data)
        response.setTopMembers(buildTopMembers(activeMembers, activitiesByUser, userTopBadge));

        // Insights
        response.setInsights(buildInsights(activeMembers, activitiesByUser, categoryBreakdown, totalCO2));

        log.info("Dashboard loaded in {} ms ({} activities, {} members)",
                System.currentTimeMillis() - start, activities.size(), activeMembers.size());

        return response;
    }

    private BigDecimal sumCO2(List<ActivityLog> activities) {
        return activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private List<OrganizationDashboardResponse.TrendPoint> buildTrend(
            Map<LocalDate, List<ActivityLog>> byDate, String range,
            LocalDate startDate, LocalDate endDate) {
        List<OrganizationDashboardResponse.TrendPoint> points = new ArrayList<>();
        DateTimeFormatter dailyFmt = DateTimeFormatter.ofPattern("MMM dd");
        DateTimeFormatter monthlyFmt = DateTimeFormatter.ofPattern("MMM");

        if ("monthly".equalsIgnoreCase(range)) {
            LocalDate cursor = startDate.withDayOfMonth(1);
            while (!cursor.isAfter(endDate)) {
                LocalDate mStart = cursor;
                LocalDate mEnd = cursor.plusMonths(1).minusDays(1);
                List<ActivityLog> bucket = collectBetween(byDate, mStart, mEnd);
                points.add(makePoint(cursor.format(monthlyFmt), bucket));
                cursor = cursor.plusMonths(1);
            }
        } else if ("yearly".equalsIgnoreCase(range)) {
            LocalDate cursor = startDate.withDayOfYear(1);
            while (!cursor.isAfter(endDate)) {
                LocalDate yStart = cursor;
                LocalDate yEnd = cursor.plusYears(1).minusDays(1);
                List<ActivityLog> bucket = collectBetween(byDate, yStart, yEnd);
                points.add(makePoint(String.valueOf(cursor.getYear()), bucket));
                cursor = cursor.plusYears(1);
            }
        } else if ("weekly".equalsIgnoreCase(range)) {
            LocalDate cursor = startDate;
            int weekNum = 1;
            while (cursor.isBefore(endDate)) {
                LocalDate wEnd = cursor.plusDays(6);
                if (wEnd.isAfter(endDate)) wEnd = endDate;
                List<ActivityLog> bucket = collectBetween(byDate, cursor, wEnd);
                points.add(makePoint("Week " + weekNum, bucket));
                cursor = cursor.plusWeeks(1);
                weekNum++;
            }
        } else {
            LocalDate cursor = startDate;
            while (!cursor.isAfter(endDate)) {
                List<ActivityLog> bucket = byDate.getOrDefault(cursor, Collections.emptyList());
                points.add(makePoint(cursor.format(dailyFmt), bucket));
                cursor = cursor.plusDays(1);
            }
        }
        return points;
    }

    private List<ActivityLog> collectBetween(
            Map<LocalDate, List<ActivityLog>> byDate, LocalDate from, LocalDate to) {
        List<ActivityLog> result = new ArrayList<>();
        LocalDate c = from;
        while (!c.isAfter(to)) {
            List<ActivityLog> day = byDate.get(c);
            if (day != null) result.addAll(day);
            c = c.plusDays(1);
        }
        return result;
    }

    private OrganizationDashboardResponse.TrendPoint makePoint(String period, List<ActivityLog> bucket) {
        OrganizationDashboardResponse.TrendPoint p = new OrganizationDashboardResponse.TrendPoint();
        p.setPeriod(period);
        p.setTotalCO2e(sumCO2(bucket));
        p.setActivityCount((long) bucket.size());
        return p;
    }

    private List<OrganizationDashboardResponse.TopMember> buildTopMembers(
            List<OrganizationMember> activeMembers,
            Map<Long, List<ActivityLog>> activitiesByUser,
            Map<Long, String> userTopBadge) {
        List<OrganizationDashboardResponse.TopMember> top = new ArrayList<>();
        for (OrganizationMember m : activeMembers) {
            Long userId = m.getUser().getId();
            List<ActivityLog> userActs = activitiesByUser.getOrDefault(userId, Collections.emptyList());
            if (userActs.isEmpty()) continue;

            OrganizationDashboardResponse.TopMember tm = new OrganizationDashboardResponse.TopMember();
            tm.setUserId(userId);
            tm.setName(m.getUser().getFullName());
            tm.setEmail(m.getUser().getEmail());
            tm.setEmission(sumCO2(userActs));
            tm.setActivityCount((long) userActs.size());
            tm.setTopBadge(userTopBadge.getOrDefault(userId, "—"));
            top.add(tm);
        }
        top.sort(Comparator.comparing(OrganizationDashboardResponse.TopMember::getEmission));
        return top.stream().limit(10).collect(Collectors.toList());
    }

    private OrganizationDashboardResponse.Insights buildInsights(
            List<OrganizationMember> activeMembers,
            Map<Long, List<ActivityLog>> activitiesByUser,
            Map<String, BigDecimal> categoryBreakdown,
            BigDecimal totalCO2) {
        OrganizationDashboardResponse.Insights insights = new OrganizationDashboardResponse.Insights();
        insights.setTotalEmission(totalCO2);

        // Best performer
        OrganizationDashboardResponse.TopMember best = null;
        for (OrganizationMember m : activeMembers) {
            Long userId = m.getUser().getId();
            List<ActivityLog> userActs = activitiesByUser.getOrDefault(userId, Collections.emptyList());
            if (userActs.isEmpty()) continue;
            BigDecimal emission = sumCO2(userActs);
            if (best == null || emission.compareTo(best.getEmission()) < 0) {
                OrganizationDashboardResponse.TopMember t = new OrganizationDashboardResponse.TopMember();
                t.setName(m.getUser().getFullName());
                t.setEmission(emission);
                best = t;
            }
        }
        if (best != null) {
            insights.setBestPerformerName(best.getName());
            insights.setBestPerformerEmission(best.getEmission());
        } else {
            insights.setBestPerformerName("—");
            insights.setBestPerformerEmission(BigDecimal.ZERO);
        }

        // Highest category
        String highestCat = "—";
        BigDecimal highestVal = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> e : categoryBreakdown.entrySet()) {
            if (e.getValue().compareTo(highestVal) > 0) {
                highestVal = e.getValue();
                highestCat = e.getKey();
            }
        }
        insights.setHighestCategoryName(highestCat);
        insights.setHighestCategoryEmission(highestVal);

        // Average across active members
        if (!activeMembers.isEmpty()) {
            insights.setAverageEmission(totalCO2.divide(
                    BigDecimal.valueOf(activeMembers.size()), 2, RoundingMode.HALF_UP));
        } else {
            insights.setAverageEmission(BigDecimal.ZERO);
        }
        return insights;
    }

    private Map<String, BigDecimal> emptyCategoryMap() {
        Map<String, BigDecimal> map = new HashMap<>();
        map.put("Transport", BigDecimal.ZERO);
        map.put("Electricity", BigDecimal.ZERO);
        map.put("Food", BigDecimal.ZERO);
        map.put("Shopping", BigDecimal.ZERO);
        return map;
    }

    private OrganizationDashboardResponse.Insights emptyInsights() {
        OrganizationDashboardResponse.Insights i = new OrganizationDashboardResponse.Insights();
        i.setBestPerformerName("—");
        i.setBestPerformerEmission(BigDecimal.ZERO);
        i.setHighestCategoryName("—");
        i.setHighestCategoryEmission(BigDecimal.ZERO);
        i.setAverageEmission(BigDecimal.ZERO);
        i.setTotalEmission(BigDecimal.ZERO);
        return i;
    }
}