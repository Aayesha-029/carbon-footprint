package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.OrganizerRegisterRequest;
import com.ecotrack.carbon.dto.request.OrganizationUpdateRequest;
import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.OrganizationMemberRepository;
import com.ecotrack.carbon.repository.OrganizationRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> registerOrganizer(OrganizerRegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        // Check if organization name already exists
        if (organizationRepository.existsByName(request.getOrganizationName())) {
            throw new RuntimeException("Organization name already taken");
        }

        // ============ Create user (Organizer) ============
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("ORGANIZER");
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // ============ Create organization (with organizer FK) ============
        Organization organization = Organization.builder()
                .name(request.getOrganizationName())
                .description(request.getOrganizationDescription())
                .email(request.getOrganizationEmail() != null ? request.getOrganizationEmail() : request.getEmail())
                .phone(request.getOrganizationPhone())
                .address(request.getOrganizationAddress())
                .status("ACTIVE")
                .organizer(savedUser)   // ← owner reference
                .build();
        Organization savedOrg = organizationRepository.save(organization);

        // ============ NOTE: Do NOT add organizer as a member ============
        // The organizer is the OWNER of the organization (via organizer_id FK).
        // They are NOT an employee. Employee records are created only when
        // the organizer invites people via the Employees module.

        // ============ Send welcome email ============
        try {
            notificationService.sendWelcomeEmail(savedUser);
        } catch (Exception e) {
            log.warn("Welcome email failed (continuing): {}", e.getMessage());
        }

        // ============ Return user and organization info ============
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("fullName", savedUser.getFullName());
        response.put("role", savedUser.getRole());
        response.put("organizationId", savedOrg.getId());
        response.put("organizationName", savedOrg.getName());
        return response;
    }

    public Organization getOrganizationById(Long orgId) {
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    public Organization getOrganizationByOrganizerId(Long organizerId) {
        return organizationRepository.findByOrganizerId(organizerId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    @Transactional
    public Organization updateOrganization(Long orgId, OrganizationUpdateRequest request, Long userId) {
        Organization org = getOrganizationById(orgId);
        // Verify user is the organizer (owner)
        if (!org.getOrganizer().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to update this organization");
        }
        org.setName(request.getName());
        org.setDescription(request.getDescription());
        org.setEmail(request.getEmail());
        org.setPhone(request.getPhone());
        org.setAddress(request.getAddress());
        return organizationRepository.save(org);
    }

    // ============ Convert entity to DTO (avoid lazy-loading serialization issues) ============
    private com.ecotrack.carbon.dto.response.OrganizationResponse toResponse(Organization org) {
        com.ecotrack.carbon.dto.response.OrganizationResponse response =
                new com.ecotrack.carbon.dto.response.OrganizationResponse();
        response.setId(org.getId());
        response.setName(org.getName());
        response.setDescription(org.getDescription());
        response.setEmail(org.getEmail());
        response.setPhone(org.getPhone());
        response.setAddress(org.getAddress());
        response.setStatus(org.getStatus());
        if (org.getOrganizer() != null) {
            response.setOrganizerId(org.getOrganizer().getId());
            response.setOrganizerName(org.getOrganizer().getFullName());
            response.setOrganizerEmail(org.getOrganizer().getEmail());
        }
        response.setCreatedAt(org.getCreatedAt());
        response.setUpdatedAt(org.getUpdatedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public com.ecotrack.carbon.dto.response.OrganizationResponse getOrganizationResponse(Long orgId) {
        return toResponse(getOrganizationById(orgId));
    }

    @Transactional(readOnly = true)
    public com.ecotrack.carbon.dto.response.OrganizationResponse getOrganizationResponseByOrganizerId(Long organizerId) {
        return toResponse(getOrganizationByOrganizerId(organizerId));
    }
}