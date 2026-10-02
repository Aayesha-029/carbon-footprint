package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.ProfileUpdateRequest;
import com.ecotrack.carbon.dto.response.ProfileResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.entity.UserProfile;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.BadgeRepository;
import com.ecotrack.carbon.repository.UserProfileRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BadgeRepository badgeRepository;

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));

        List<ActivityLog> activities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);

        BigDecimal totalCO2e = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long badgeCount = badgeRepository.findByUserId(userId).size();

        int carbonScore = calculateCarbonScore(totalCO2e, activities.size());

        ProfileResponse response = new ProfileResponse();
        response.setUserId(userId);
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setBio(profile.getBio());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setPreferredUnits(profile.getPreferredUnits());
        response.setDietType(profile.getDietType());
        response.setPrimaryTransportMode(profile.getPrimaryTransportMode());
        response.setEnergySource(profile.getEnergySource());
        response.setNotificationsEnabled(profile.isNotificationsEnabled());
        response.setTheme(profile.getTheme());
        response.setLanguage(profile.getLanguage());
        response.setTotalCO2e(totalCO2e.setScale(2, RoundingMode.HALF_UP));
        response.setTotalActivities((long) activities.size());
        response.setBadgeCount((int) badgeCount);
        response.setCarbonScore(carbonScore);
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        return response;
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));

        // Update user fields
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
            userRepository.save(user);
        }

        // Update profile fields
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getPreferredUnits() != null) {
            profile.setPreferredUnits(request.getPreferredUnits());
        }
        if (request.getDietType() != null) {
            profile.setDietType(request.getDietType());
        }
        if (request.getPrimaryTransportMode() != null) {
            profile.setPrimaryTransportMode(request.getPrimaryTransportMode());
        }
        if (request.getEnergySource() != null) {
            profile.setEnergySource(request.getEnergySource());
        }
        if (request.getNotificationsEnabled() != null) {
            profile.setNotificationsEnabled(request.getNotificationsEnabled());
        }
        if (request.getTheme() != null) {
            profile.setTheme(request.getTheme());
        }
        if (request.getLanguage() != null) {
            profile.setLanguage(request.getLanguage());
        }

        profile.setUpdatedAt(LocalDateTime.now());
        userProfileRepository.save(profile);

        // Dispatch event for notification
        try {
            // Event will be handled by frontend
        } catch (Exception e) {
            System.err.println("Error sending notification: " + e.getMessage());
        }

        return getProfile(userId);
    }

    private UserProfile createDefaultProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setPreferredUnits("METRIC");
        profile.setDietType("OMNIVORE");
        profile.setPrimaryTransportMode("CAR");
        profile.setEnergySource("GRID");
        profile.setNotificationsEnabled(true);
        profile.setTheme("light");
        profile.setLanguage("en");
        profile.setUpdatedAt(LocalDateTime.now());
        return userProfileRepository.save(profile);
    }

    private int calculateCarbonScore(BigDecimal totalCO2e, long activityCount) {
        if (activityCount == 0) {
            return 100;
        }
        double score = 100 - (totalCO2e.doubleValue() / (activityCount * 0.5));
        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }
}