package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.AcceptInvitationRequest;
import com.ecotrack.carbon.dto.request.AddEmployeeRequest;
import com.ecotrack.carbon.dto.request.InviteMemberRequest;
import com.ecotrack.carbon.dto.request.UpdateEmployeeRequest;
import com.ecotrack.carbon.dto.response.MemberResponse;
import com.ecotrack.carbon.entity.*;
import com.ecotrack.carbon.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MemberService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final OrganizationInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final long INVITATION_EXPIRY_HOURS = 168;

    private static final String PWD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(PWD_CHARS.charAt(RANDOM.nextInt(PWD_CHARS.length())));
        }
        return sb.toString();
    }

    // ============ ADD EMPLOYEE (primary flow) ============
    @Transactional
    public MemberResponse addEmployee(Long orgId, AddEmployeeRequest req, Long inviterId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new RuntimeException("Inviter not found"));

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Create user with temp password
        User user = new User();
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setFullName(req.getFullName() != null && !req.getFullName().isBlank()
                ? req.getFullName()
                : req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getTempPassword()));
        user.setRole("USER");
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        // Create member with ACTIVE status
        OrganizationMember member = OrganizationMember.builder()
                .organization(org)
                .user(user)
                .status("ACTIVE")
                .invitedAt(LocalDateTime.now())
                .joinedAt(LocalDateTime.now())
                .build();
        memberRepository.save(member);

        // Send credentials email
        try {
            notificationService.sendEmployeeCredentialsEmail(
                    user.getEmail(),
                    user.getFullName(),
                    inviter.getFullName(),
                    org.getName(),
                    user.getUsername(),
                    req.getTempPassword()
            );
        } catch (Exception e) {
            log.error("Failed to send credentials email: {}", e.getMessage());
        }

        return toMemberResponse(member, user);
    }

    // ============ LIST EMPLOYEES ============
       @Transactional(readOnly = true)
    public Page<MemberResponse> listMembers(Long orgId, String status, String search, Pageable pageable) {
        // Fetch the organization to know who the organizer is
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        Long organizerId = org.getOrganizer() != null ? org.getOrganizer().getId() : null;

        Page<OrganizationMember> page;
        if (status == null || status.isEmpty() || "all".equalsIgnoreCase(status)) {
            page = (search == null || search.isEmpty())
                    ? memberRepository.findByOrganizationId(orgId, pageable)
                    : memberRepository.searchByOrganizationIdAndKeyword(orgId, search, pageable);
        } else {
            page = (search == null || search.isEmpty())
                    ? memberRepository.findByOrganizationIdAndStatus(orgId, status, pageable)
                    : memberRepository.searchByOrganizationIdAndStatusAndKeyword(orgId, status, search, pageable);
        }

        // Filter out the organizer from the result
        List<OrganizationMember> filtered = page.getContent().stream()
                .filter(m -> organizerId == null || !m.getUser().getId().equals(organizerId))
                .collect(Collectors.toList());

        // Batch fetch activity stats
        List<Long> userIds = filtered.stream()
                .map(m -> m.getUser().getId()).collect(Collectors.toList());
        Map<Long, BigDecimal> co2ByUser = new HashMap<>();
        Map<Long, Long> actsByUser = new HashMap<>();
        Map<Long, Integer> badgesByUser = new HashMap<>();

        if (!userIds.isEmpty()) {
            List<ActivityLog> acts = activityLogRepository.findByUserIdInAndLogDateBetween(
                    userIds, java.time.LocalDate.now().minusYears(5), java.time.LocalDate.now());
            for (ActivityLog a : acts) {
                Long uid = a.getUser().getId();
                co2ByUser.merge(uid, a.getCo2eKg(), BigDecimal::add);
                actsByUser.merge(uid, 1L, Long::sum);
            }
            for (Long uid : userIds) {
                badgesByUser.put(uid, badgeRepository.findByUserId(uid).size());
            }
        }

        List<MemberResponse> responses = filtered.stream().map(m -> {
            MemberResponse r = toMemberResponse(m, m.getUser());
            Long uid = m.getUser().getId();
            r.setTotalCO2e(co2ByUser.getOrDefault(uid, BigDecimal.ZERO));
            r.setActivityCount(actsByUser.getOrDefault(uid, 0L));
            r.setBadgeCount(badgesByUser.getOrDefault(uid, 0));
            return r;
        }).collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(responses, pageable, page.getTotalElements() - (page.getContent().size() - responses.size()));
    }

    private MemberResponse toMemberResponse(OrganizationMember m, User u) {
        MemberResponse r = new MemberResponse();
        r.setMemberId(m.getId());
        r.setUserId(u.getId());
        r.setUsername(u.getUsername());
        r.setFullName(u.getFullName());
        r.setEmail(u.getEmail());
        r.setStatus(m.getStatus());
        r.setJoinedAt(m.getJoinedAt());
        r.setInvitedAt(m.getInvitedAt());
        return r;
    }

    // ============ UPDATE STATUS ============
    @Transactional
    public void updateMemberStatus(Long orgId, Long memberId, String newStatus, Long organizerId) {
        OrganizationMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getOrganization().getId().equals(orgId))
            throw new RuntimeException("Member not in this organization");
        if (!member.getOrganization().getOrganizer().getId().equals(organizerId))
            throw new RuntimeException("Not authorized");
        if (!"ACTIVE".equals(newStatus) && !"INACTIVE".equals(newStatus))
            throw new RuntimeException("Invalid status");

        member.setStatus(newStatus);
        memberRepository.save(member);

        User u = member.getUser();
        u.setEnabled("ACTIVE".equals(newStatus));
        userRepository.save(u);
    }

    // ============ UPDATE EMPLOYEE ============
    @Transactional
    public MemberResponse updateEmployee(Long orgId, Long memberId, UpdateEmployeeRequest req, Long organizerId) {
        OrganizationMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getOrganization().getId().equals(orgId))
            throw new RuntimeException("Member not in this organization");
        if (!member.getOrganization().getOrganizer().getId().equals(organizerId))
            throw new RuntimeException("Not authorized");

        User u = member.getUser();
        u.setFullName(req.getFullName());
        userRepository.save(u);
        return toMemberResponse(member, u);
    }

    // ============ RESET PASSWORD (regenerate + email) ============
    @Transactional
    public String resetEmployeePassword(Long orgId, Long memberId, Long organizerId) {
        OrganizationMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getOrganization().getId().equals(orgId))
            throw new RuntimeException("Member not in this organization");
        if (!member.getOrganization().getOrganizer().getId().equals(organizerId))
            throw new RuntimeException("Not authorized");

        User u = member.getUser();
        String tempPwd = generateTempPassword();
        u.setPasswordHash(passwordEncoder.encode(tempPwd));
        userRepository.save(u);

        try {
            notificationService.sendPasswordResetByAdminEmail(
                    u.getEmail(), u.getFullName(),
                    member.getOrganization().getName(),
                    u.getUsername() != null ? u.getUsername() : u.getEmail(),
                    tempPwd
            );
        } catch (Exception e) {
            log.error("Failed to send reset email: {}", e.getMessage());
        }
        return tempPwd;
    }

    // ============ DELETE EMPLOYEE ============
    @Transactional
    public void deleteEmployee(Long orgId, Long memberId, Long organizerId) {
        OrganizationMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getOrganization().getId().equals(orgId))
            throw new RuntimeException("Member not in this organization");
        if (!member.getOrganization().getOrganizer().getId().equals(organizerId))
            throw new RuntimeException("Not authorized");

        Long userId = member.getUser().getId();

        // Don't allow deleting the organizer
        if (member.getOrganization().getOrganizer().getId().equals(userId))
            throw new RuntimeException("Cannot remove the organization owner");

        memberRepository.delete(member);
        userRepository.deleteById(userId);
    }

    // ============ LEGACY INVITE (kept for compatibility) ============
    @Transactional
    public void inviteMember(Long orgId, InviteMemberRequest request, Long inviterId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (invitationRepository.existsByEmailAndOrganizationIdAndStatus(request.getEmail(), orgId, "PENDING"))
            throw new RuntimeException("Invitation already pending");

        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(INVITATION_EXPIRY_HOURS);

        OrganizationInvitation inv = OrganizationInvitation.builder()
                .email(request.getEmail()).token(token).organization(org)
                .invitedBy(inviter).status("PENDING").expiry(expiry).build();
        invitationRepository.save(inv);

        String link = frontendUrl + "/organization/invite?token=" + token;
        notificationService.sendOrganizationInvitationEmail(
                request.getEmail(), inviter.getFullName(), org.getName(), link, expiry);
    }

    @Transactional
    public void acceptInvitation(AcceptInvitationRequest request) {
        OrganizationInvitation inv = invitationRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        if (inv.getExpiry().isBefore(LocalDateTime.now())) {
            inv.setStatus("EXPIRED");
            invitationRepository.save(inv);
            throw new RuntimeException("Invitation expired");
        }
        if ("ACCEPTED".equals(inv.getStatus())) throw new RuntimeException("Already accepted");

        Organization org = inv.getOrganization();
        String email = inv.getEmail();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            if (request.getPassword() == null || request.getFullName() == null)
                throw new RuntimeException("Password and full name required");
            user = new User();
            user.setEmail(email);
            user.setFullName(request.getFullName());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole("USER");
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        }
        if (memberRepository.existsByOrganizationIdAndUserId(org.getId(), user.getId()))
            throw new RuntimeException("Already a member");

        OrganizationMember m = OrganizationMember.builder()
                .organization(org).user(user).status("ACTIVE")
                .invitedAt(inv.getCreatedAt()).joinedAt(LocalDateTime.now()).build();
        memberRepository.save(m);

        inv.setStatus("ACCEPTED");
        invitationRepository.save(inv);
        notificationService.sendWelcomeEmail(user);
    }
}