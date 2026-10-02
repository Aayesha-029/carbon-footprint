package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.LeaderboardEntry;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Badge;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.BadgeRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;

    public List<LeaderboardEntry> getLeaderboard(String timeRange) {
        List<User> users = userRepository.findAll();
        List<LeaderboardEntry> entries = new ArrayList<>();

        for (User user : users) {
            List<ActivityLog> activities = getActivitiesForRange(user.getId(), timeRange);
            
            if (activities.isEmpty()) {
                continue; // Skip users with no activities
            }

            // Calculate total CO₂e
            BigDecimal totalCO2e = activities.stream()
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Find top category
            Map<String, BigDecimal> categoryTotals = new HashMap<>();
            for (ActivityLog log : activities) {
                categoryTotals.merge(log.getCategory(), log.getCo2eKg(), BigDecimal::add);
            }
            
            String topCategory = categoryTotals.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A");

            // Get user badges
            List<Badge> userBadges = badgeRepository.findByUserId(user.getId());
            List<String> badgeNames = userBadges.stream()
                    .map(Badge::getBadgeType)
                    .collect(Collectors.toList());

            // Calculate category score (lower is better)
            BigDecimal avgCO2e = totalCO2e.divide(BigDecimal.valueOf(Math.max(1, activities.size())), 
                    4, RoundingMode.HALF_UP);

            LeaderboardEntry entry = new LeaderboardEntry();
            entry.setUserId(user.getId());
            entry.setUserName(user.getFullName());
            entry.setTotalCO2e(totalCO2e.setScale(2, RoundingMode.HALF_UP));
            entry.setActivityCount((long) activities.size());
            entry.setBadges(badgeNames);
            entry.setTopCategory(topCategory);
            entry.setCategoryScore(avgCO2e.setScale(2, RoundingMode.HALF_UP));
            entries.add(entry);
        }

        // Sort by lowest CO2e first (most eco-friendly)
        entries.sort(Comparator.comparing(LeaderboardEntry::getTotalCO2e));

        // Assign ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries.stream().limit(50).collect(Collectors.toList());
    }

    public Map<String, Object> getUserRanking(Long userId) {
        List<LeaderboardEntry> allEntries = getLeaderboard("all");
        
        // Find user's position
        int position = -1;
        for (int i = 0; i < allEntries.size(); i++) {
            if (allEntries.get(i).getUserId().equals(userId)) {
                position = i + 1;
                break;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("rank", position);
        result.put("totalUsers", allEntries.size());
        
        if (position > 0 && position <= allEntries.size()) {
            result.put("userEntry", allEntries.get(position - 1));
        }
        
        // Calculate percentile
        if (position > 0) {
            double percentile = ((double) (allEntries.size() - position) / allEntries.size()) * 100;
            result.put("percentile", Math.round(percentile));
        }

        return result;
    }

    private List<ActivityLog> getActivitiesForRange(Long userId, String timeRange) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;

        switch (timeRange.toLowerCase()) {
            case "weekly":
                startDate = endDate.minusWeeks(1);
                break;
            case "monthly":
                startDate = endDate.minusMonths(1);
                break;
            case "yearly":
                startDate = endDate.minusYears(1);
                break;
            default:
                startDate = LocalDate.of(2020, 1, 1);
                break;
        }

        return activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(
                userId, startDate, endDate);
    }
}