package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.entity.*;
import com.ecotrack.carbon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations/{orgId}")
@RequiredArgsConstructor
public class OrganizationInsightsController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BadgeRepository badgeRepository;

    // Helper: fetch members excluding the organizer
    private List<OrganizationMember> getNonOrganizerMembers(Long orgId) {
        Organization org = organizationRepository.findById(orgId).orElse(null);
        Long organizerId = (org != null && org.getOrganizer() != null)
                ? org.getOrganizer().getId() : null;

        return memberRepository.findByOrganizationIdWithUser(orgId)
                .stream()
                .filter(m -> organizerId == null || !m.getUser().getId().equals(organizerId))
                .collect(Collectors.toList());
    }

    // ============ EMPLOYEE BADGES ============
    @GetMapping("/badges")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> getBadges(@PathVariable Long orgId) {
        List<OrganizationMember> members = getNonOrganizerMembers(orgId);
        List<Map<String, Object>> result = new ArrayList<>();
        int totalBadges = 0;

        for (OrganizationMember m : members) {
            if (!"ACTIVE".equals(m.getStatus())) continue;
            User u = m.getUser();
            List<Badge> badges = badgeRepository.findByUserId(u.getId());
            totalBadges += badges.size();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", u.getId());
            row.put("name", u.getFullName());
            row.put("email", u.getEmail());
            row.put("badgeCount", badges.size());
            row.put("badges", badges.stream().map(b -> {
                Map<String, Object> bm = new LinkedHashMap<>();
                bm.put("id", b.getId());
                bm.put("type", b.getBadgeType());
                bm.put("earnedAt", b.getEarnedAt());
                return bm;
            }).collect(Collectors.toList()));
            result.add(row);
        }
        return ResponseEntity.ok(Map.of("total", totalBadges, "members", result));
    }

    // ============ ACTIVITY MANAGEMENT ============
    @GetMapping("/activities")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> getActivities(
            @PathVariable Long orgId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        List<OrganizationMember> members = getNonOrganizerMembers(orgId);
        List<Long> userIds = members.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .map(m -> m.getUser().getId()).collect(Collectors.toList());

        if (userIds.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "activities", Collections.emptyList(),
                    "totalActivities", 0,
                    "totalEmission", BigDecimal.ZERO));
        }

        java.time.LocalDate start = (startDate != null && !startDate.isEmpty())
                ? java.time.LocalDate.parse(startDate) : java.time.LocalDate.now().minusYears(1);
        java.time.LocalDate end = (endDate != null && !endDate.isEmpty())
                ? java.time.LocalDate.parse(endDate) : java.time.LocalDate.now();

        List<ActivityLog> activities = activityLogRepository
                .findByUserIdInAndLogDateBetween(userIds, start, end);

        if (search != null && !search.isEmpty()) {
            String q = search.toLowerCase();
            activities = activities.stream()
                    .filter(a -> a.getUser().getFullName().toLowerCase().contains(q)
                            || a.getActivityType().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }
        if (category != null && !category.isEmpty() && !"all".equalsIgnoreCase(category)) {
            activities = activities.stream()
                    .filter(a -> a.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }

        activities.sort(Comparator.comparing(ActivityLog::getLogDate).reversed());

        BigDecimal totalEmission = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        List<Map<String, Object>> list = activities.stream().map(a -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", a.getId());
            r.put("memberName", a.getUser().getFullName());
            r.put("memberEmail", a.getUser().getEmail());
            r.put("category", a.getCategory());
            r.put("activityType", a.getActivityType());
            r.put("quantity", a.getQuantity());
            r.put("unit", a.getUnit());
            r.put("co2eKg", a.getCo2eKg());
            r.put("logDate", a.getLogDate());
            r.put("notes", a.getNotes());
            return r;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "activities", list,
                "totalActivities", list.size(),
                "totalEmission", totalEmission));
    }

    // ============ LEADERBOARD ============
    @GetMapping("/leaderboard")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> getLeaderboard(@PathVariable Long orgId) {
        List<OrganizationMember> members = getNonOrganizerMembers(orgId);
        List<Long> userIds = members.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .map(m -> m.getUser().getId()).collect(Collectors.toList());

        if (userIds.isEmpty()) return ResponseEntity.ok(Collections.emptyList());

        List<ActivityLog> activities = activityLogRepository.findByUserIdInAndLogDateBetween(
                userIds, java.time.LocalDate.now().minusMonths(1), java.time.LocalDate.now());

        Map<Long, List<ActivityLog>> byUser = activities.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId()));

        List<Map<String, Object>> ranked = new ArrayList<>();
        for (OrganizationMember m : members) {
            if (!"ACTIVE".equals(m.getStatus())) continue;
            User u = m.getUser();
            List<ActivityLog> ua = byUser.getOrDefault(u.getId(), Collections.emptyList());
            if (ua.isEmpty()) continue;

            BigDecimal total = ua.stream().map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            int badgeCount = badgeRepository.findByUserId(u.getId()).size();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", u.getId());
            row.put("name", u.getFullName());
            row.put("email", u.getEmail());
            row.put("totalEmission", total);
            row.put("activityCount", ua.size());
            row.put("badgeCount", badgeCount);
            ranked.add(row);
        }

        ranked.sort(Comparator.comparing(r -> (BigDecimal) r.get("totalEmission")));
        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).put("rank", i + 1);
        }
        return ResponseEntity.ok(ranked);
    }
}