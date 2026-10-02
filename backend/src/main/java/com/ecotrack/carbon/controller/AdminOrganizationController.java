package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.OrganizationAdminResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.entity.OrganizationMember;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.OrganizationMemberRepository;
import com.ecotrack.carbon.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/organizations")
@RequiredArgsConstructor
@Slf4j
public class AdminOrganizationController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrganizationAdminResponse>> getAllOrganizations() {
        List<Organization> orgs = organizationRepository.findAll();
        List<OrganizationAdminResponse> result = new ArrayList<>();

        LocalDate startDate = LocalDate.now().minusYears(5);
        LocalDate endDate = LocalDate.now();

        for (Organization org : orgs) {
            Long organizerId = org.getOrganizer() != null ? org.getOrganizer().getId() : null;

            // Fetch members and EXCLUDE the organizer (safety filter)
            List<OrganizationMember> members = memberRepository.findByOrganizationIdWithUser(org.getId())
                    .stream()
                    .filter(m -> organizerId == null || !m.getUser().getId().equals(organizerId))
                    .collect(Collectors.toList());

            List<Long> userIds = members.stream()
                    .map(m -> m.getUser().getId())
                    .collect(Collectors.toList());

            long activeCount = members.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()))
                    .count();

            BigDecimal totalCO2 = BigDecimal.ZERO;
            if (!userIds.isEmpty()) {
                List<ActivityLog> acts = activityLogRepository
                        .findByUserIdInAndLogDateBetween(userIds, startDate, endDate);
                totalCO2 = acts.stream()
                        .map(ActivityLog::getCo2eKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);
            }

            OrganizationAdminResponse dto = new OrganizationAdminResponse();
            dto.setId(org.getId());
            dto.setName(org.getName());
            dto.setDescription(org.getDescription());
            dto.setEmail(org.getEmail());
            dto.setPhone(org.getPhone());
            dto.setAddress(org.getAddress());
            dto.setStatus(org.getStatus());
            dto.setCreatedAt(org.getCreatedAt());
            dto.setUpdatedAt(org.getUpdatedAt());

            if (org.getOrganizer() != null) {
                dto.setOrganizerId(org.getOrganizer().getId());
                dto.setOrganizerName(org.getOrganizer().getFullName());
                dto.setOrganizerEmail(org.getOrganizer().getEmail());
            }

            dto.setMemberCount((long) members.size());
            dto.setActiveMemberCount(activeCount);
            dto.setTotalCO2(totalCO2);

            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        String normalized = status == null ? "ACTIVE" : status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
        }

        org.setStatus(normalized);
        organizationRepository.save(org);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + normalized));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteOrganization(@PathVariable Long id) {
        if (!organizationRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Organization not found"));
        }
        organizationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Organization deleted"));
    }
}