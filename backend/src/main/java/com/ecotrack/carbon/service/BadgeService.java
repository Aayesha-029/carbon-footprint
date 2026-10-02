package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.BadgeResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Badge;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.BadgeRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationService notificationService;

    // Badge definitions
    private static final Map<String, BadgeDefinition> BADGE_DEFINITIONS = new LinkedHashMap<>();
    
    static {
        BADGE_DEFINITIONS.put("FIRST_STEP", new BadgeDefinition(
                "First Step", "🌱", "Logged your first activity",
                "First activity logged", 1
        ));
        BADGE_DEFINITIONS.put("COMMUTER", new BadgeDefinition(
                "Commuter", "🚗", "10 transport activities logged",
                "10 transport activities", 10
        ));
        BADGE_DEFINITIONS.put("ENERGY_SAVER", new BadgeDefinition(
                "Energy Saver", "💡", "10 electricity activities logged",
                "10 electricity activities", 10
        ));
        BADGE_DEFINITIONS.put("FOOD_EXPLORER", new BadgeDefinition(
                "Food Explorer", "🍽️", "10 food activities logged",
                "10 food activities", 10
        ));
        BADGE_DEFINITIONS.put("SMART_SHOPPER", new BadgeDefinition(
                "Smart Shopper", "🛍️", "10 shopping activities logged",
                "10 shopping activities", 10
        ));
        BADGE_DEFINITIONS.put("GREEN_WARRIOR", new BadgeDefinition(
                "Green Warrior", "🏅", "Saved 20 kg CO₂e",
                "20 kg CO₂e saved", 20
        ));
        BADGE_DEFINITIONS.put("EARTH_HERO", new BadgeDefinition(
                "Earth Hero", "🌍", "Saved 50 kg CO₂e",
                "50 kg CO₂e saved", 50
        ));
        BADGE_DEFINITIONS.put("ECO_EXPERT", new BadgeDefinition(
                "Eco Expert", "⭐", "15 activities logged",
                "15 activities logged", 15
        ));
        BADGE_DEFINITIONS.put("DEDICATED", new BadgeDefinition(
                "Dedicated Tracker", "📊", "30 activities logged",
                "30 activities logged", 30
        ));
        BADGE_DEFINITIONS.put("CARBON_MASTER", new BadgeDefinition(
                "Carbon Master", "🏆", "100 kg CO₂e saved",
                "100 kg CO₂e saved", 100
        ));
    }

    @Transactional
    public BadgeResponse assignBadge(Long userId, String badgeType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already has this badge
        if (badgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            throw new RuntimeException("Badge already assigned to this user");
        }

        BadgeDefinition definition = BADGE_DEFINITIONS.get(badgeType);
        if (definition == null) {
            throw new RuntimeException("Invalid badge type: " + badgeType);
        }

        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(badgeType);
        badge.setEarnedAt(LocalDateTime.now());

        Badge saved = badgeRepository.save(badge);

        // Send notification for badge earned - IMPORTANT
        try {
            System.out.println("🏅 Sending notification for badge: " + definition.name + " to user: " + userId);
            notificationService.notifyBadgeEarned(userId, definition.name);
            System.out.println("✅ Notification sent for badge: " + definition.name);
        } catch (Exception e) {
            System.err.println("❌ Failed to send badge notification: " + e.getMessage());
            e.printStackTrace();
        }

        return toResponse(saved);
    }

    public List<BadgeResponse> getUserBadges(Long userId) {
        return badgeRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBadge(Long id, Long userId) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Badge not found"));
        
        // Verify the badge belongs to the user
        if (!badge.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own badges");
        }

        // Get badge name for notification
        String badgeType = badge.getBadgeType();
        BadgeDefinition definition = BADGE_DEFINITIONS.get(badgeType);
        String displayName = definition != null ? definition.name : badgeType;
        
        // Delete the badge
        badgeRepository.delete(badge);

        // Send notification for badge deletion - IMPORTANT
        try {
            System.out.println("🗑️ Sending notification for badge deletion: " + displayName + " for user: " + userId);
            notificationService.notifyBadgeDeleted(userId, displayName);
            System.out.println("✅ Notification sent for badge deletion: " + displayName);
        } catch (Exception e) {
            System.err.println("❌ Failed to send badge deletion notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public Map<String, Object> getBadgeProgress(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ActivityLog> activities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
        List<Badge> existingBadges = badgeRepository.findByUserId(userId);
        List<String> existingBadgeTypes = existingBadges.stream()
                .map(Badge::getBadgeType)
                .collect(Collectors.toList());

        Map<String, Object> progress = new HashMap<>();
        progress.put("totalBadges", BADGE_DEFINITIONS.size());
        progress.put("earnedBadges", existingBadges.size());
        progress.put("badges", new ArrayList<>());

        // Calculate progress for each badge
        for (Map.Entry<String, BadgeDefinition> entry : BADGE_DEFINITIONS.entrySet()) {
            String type = entry.getKey();
            BadgeDefinition def = entry.getValue();
            
            Map<String, Object> badgeInfo = new HashMap<>();
            badgeInfo.put("type", type);
            badgeInfo.put("name", def.name);
            badgeInfo.put("icon", def.icon);
            badgeInfo.put("description", def.description);
            badgeInfo.put("earned", existingBadgeTypes.contains(type));
            
            // Calculate progress based on badge type
            if (!existingBadgeTypes.contains(type)) {
                int progressValue = 0;
                switch (type) {
                    case "FIRST_STEP":
                        progressValue = activities.isEmpty() ? 0 : 100;
                        break;
                    case "COMMUTER":
                        long transportCount = activities.stream()
                                .filter(a -> "Transport".equals(a.getCategory()))
                                .count();
                        progressValue = (int) Math.min(100, (transportCount * 100) / 10);
                        break;
                    case "ENERGY_SAVER":
                        long electricityCount = activities.stream()
                                .filter(a -> "Electricity".equals(a.getCategory()))
                                .count();
                        progressValue = (int) Math.min(100, (electricityCount * 100) / 10);
                        break;
                    case "FOOD_EXPLORER":
                        long foodCount = activities.stream()
                                .filter(a -> "Food".equals(a.getCategory()))
                                .count();
                        progressValue = (int) Math.min(100, (foodCount * 100) / 10);
                        break;
                    case "SMART_SHOPPER":
                        long shoppingCount = activities.stream()
                                .filter(a -> "Shopping".equals(a.getCategory()))
                                .count();
                        progressValue = (int) Math.min(100, (shoppingCount * 100) / 10);
                        break;
                    case "GREEN_WARRIOR":
                        BigDecimal saved20 = activities.stream()
                                .map(ActivityLog::getCo2eKg)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        progressValue = (int) Math.min(100, (saved20.doubleValue() * 100) / 20);
                        break;
                    case "EARTH_HERO":
                        BigDecimal saved50 = activities.stream()
                                .map(ActivityLog::getCo2eKg)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        progressValue = (int) Math.min(100, (saved50.doubleValue() * 100) / 50);
                        break;
                    case "ECO_EXPERT":
                        progressValue = (int) Math.min(100, (activities.size() * 100) / 15);
                        break;
                    case "DEDICATED":
                        progressValue = (int) Math.min(100, (activities.size() * 100) / 30);
                        break;
                    case "CARBON_MASTER":
                        BigDecimal saved100 = activities.stream()
                                .map(ActivityLog::getCo2eKg)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        progressValue = (int) Math.min(100, (saved100.doubleValue() * 100) / 100);
                        break;
                    default:
                        progressValue = 0;
                }
                badgeInfo.put("progress", Math.min(100, progressValue));
            } else {
                badgeInfo.put("progress", 100);
            }
            
            ((List<Map<String, Object>>) progress.get("badges")).add(badgeInfo);
        }

        return progress;
    }

    @Transactional
    public List<BadgeResponse> checkAndAwardBadges(Long userId) {
        List<ActivityLog> activities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
        List<Badge> existingBadges = badgeRepository.findByUserId(userId);
        List<String> existingBadgeTypes = existingBadges.stream()
                .map(Badge::getBadgeType)
                .collect(Collectors.toList());

        List<BadgeResponse> awardedBadges = new ArrayList<>();

        // Check each badge condition
        if (!existingBadgeTypes.contains("FIRST_STEP") && !activities.isEmpty()) {
            awardedBadges.add(assignBadge(userId, "FIRST_STEP"));
        }

        long transportCount = activities.stream()
                .filter(a -> "Transport".equals(a.getCategory()))
                .count();
        if (!existingBadgeTypes.contains("COMMUTER") && transportCount >= 10) {
            awardedBadges.add(assignBadge(userId, "COMMUTER"));
        }

        long electricityCount = activities.stream()
                .filter(a -> "Electricity".equals(a.getCategory()))
                .count();
        if (!existingBadgeTypes.contains("ENERGY_SAVER") && electricityCount >= 10) {
            awardedBadges.add(assignBadge(userId, "ENERGY_SAVER"));
        }

        long foodCount = activities.stream()
                .filter(a -> "Food".equals(a.getCategory()))
                .count();
        if (!existingBadgeTypes.contains("FOOD_EXPLORER") && foodCount >= 10) {
            awardedBadges.add(assignBadge(userId, "FOOD_EXPLORER"));
        }

        long shoppingCount = activities.stream()
                .filter(a -> "Shopping".equals(a.getCategory()))
                .count();
        if (!existingBadgeTypes.contains("SMART_SHOPPER") && shoppingCount >= 10) {
            awardedBadges.add(assignBadge(userId, "SMART_SHOPPER"));
        }

        BigDecimal totalSaved = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (!existingBadgeTypes.contains("GREEN_WARRIOR") && totalSaved.compareTo(BigDecimal.valueOf(20)) >= 0) {
            awardedBadges.add(assignBadge(userId, "GREEN_WARRIOR"));
        }

        if (!existingBadgeTypes.contains("EARTH_HERO") && totalSaved.compareTo(BigDecimal.valueOf(50)) >= 0) {
            awardedBadges.add(assignBadge(userId, "EARTH_HERO"));
        }

        if (!existingBadgeTypes.contains("ECO_EXPERT") && activities.size() >= 15) {
            awardedBadges.add(assignBadge(userId, "ECO_EXPERT"));
        }

        if (!existingBadgeTypes.contains("DEDICATED") && activities.size() >= 30) {
            awardedBadges.add(assignBadge(userId, "DEDICATED"));
        }

        if (!existingBadgeTypes.contains("CARBON_MASTER") && totalSaved.compareTo(BigDecimal.valueOf(100)) >= 0) {
            awardedBadges.add(assignBadge(userId, "CARBON_MASTER"));
        }

        return awardedBadges;
    }

    private BadgeResponse toResponse(Badge badge) {
        BadgeResponse response = new BadgeResponse();
        response.setId(badge.getId());
        response.setUserId(badge.getUser().getId());
        response.setUserName(badge.getUser().getFullName());
        response.setBadgeType(badge.getBadgeType());
        response.setEarnedAt(badge.getEarnedAt());

        BadgeDefinition definition = BADGE_DEFINITIONS.get(badge.getBadgeType());
        if (definition != null) {
            response.setBadgeName(definition.name);
            response.setBadgeIcon(definition.icon);
            response.setDescription(definition.description);
        }

        return response;
    }

    private static class BadgeDefinition {
        final String name;
        final String icon;
        final String description;
        final String requirement;
        final int threshold;

        BadgeDefinition(String name, String icon, String description, String requirement, int threshold) {
            this.name = name;
            this.icon = icon;
            this.description = description;
            this.requirement = requirement;
            this.threshold = threshold;
        }
    }
}