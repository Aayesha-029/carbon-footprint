package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.OrganizationUpdateRequest;
import com.ecotrack.carbon.dto.response.OrganizationDashboardResponse;
import com.ecotrack.carbon.dto.response.OrganizationResponse;
import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.OrganizationDashboardService;
import com.ecotrack.carbon.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationDashboardService dashboardService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{orgId}")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<OrganizationResponse> getOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(organizationService.getOrganizationResponse(orgId));
    }

    @PutMapping("/{orgId}")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<OrganizationResponse> updateOrganization(
            @PathVariable Long orgId,
            @Valid @RequestBody OrganizationUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        Organization updated = organizationService.updateOrganization(orgId, request, userId);
       return ResponseEntity.ok(organizationService.getOrganizationResponse(updated.getId()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<OrganizationResponse> getMyOrganization(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(organizationService.getOrganizationResponseByOrganizerId(userId));
    }

    // ============ NEW: Corporate Dashboard endpoint ============
    @GetMapping("/{orgId}/dashboard")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<OrganizationDashboardResponse> getDashboard(
            @PathVariable Long orgId,
            @RequestParam(defaultValue = "daily") String range) {
        return ResponseEntity.ok(dashboardService.getDashboard(orgId, range));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) {
            throw new RuntimeException("Invalid token");
        }
        return userId;
    }
}