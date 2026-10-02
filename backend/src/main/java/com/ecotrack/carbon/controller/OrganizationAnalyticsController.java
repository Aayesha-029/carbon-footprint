package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.OrganizationAnalyticsResponse;
import com.ecotrack.carbon.service.OrganizationAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/organizations/{orgId}/analytics")
@RequiredArgsConstructor
public class OrganizationAnalyticsController {

    private final OrganizationAnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> getAnalytics(
            @PathVariable Long orgId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        OrganizationAnalyticsResponse response = analyticsService.getAnalytics(orgId, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}