package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.AddEmployeeRequest;
import com.ecotrack.carbon.dto.request.InviteMemberRequest;
import com.ecotrack.carbon.dto.request.UpdateEmployeeRequest;
import com.ecotrack.carbon.dto.response.MemberResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/organizations/{orgId}/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    @GetMapping
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> listMembers(
            @PathVariable Long orgId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("invitedAt").descending());
        Page<MemberResponse> members = memberService.listMembers(orgId, status, search, pageable);
        Map<String, Object> r = new HashMap<>();
        r.put("content", members.getContent());
        r.put("totalPages", members.getTotalPages());
        r.put("totalElements", members.getTotalElements());
        r.put("currentPage", members.getNumber());
        return ResponseEntity.ok(r);
    }

    // ============ ADD EMPLOYEE (primary) ============
    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> addEmployee(
            @PathVariable Long orgId,
            @Valid @RequestBody AddEmployeeRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long inviterId = extractUserId(authHeader);
        MemberResponse created = memberService.addEmployee(orgId, request, inviterId);
        return ResponseEntity.ok(Map.of("message", "Employee added successfully", "member", created));
    }

    // ============ LEGACY: invite via token ============
    @PostMapping("/invitations")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> inviteMember(
            @PathVariable Long orgId,
            @Valid @RequestBody InviteMemberRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long inviterId = extractUserId(authHeader);
        memberService.inviteMember(orgId, request, inviterId);
        return ResponseEntity.ok(Map.of("message", "Invitation sent"));
    }

    @PutMapping("/{memberId}/status")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> updateMemberStatus(
            @PathVariable Long orgId, @PathVariable Long memberId,
            @RequestParam String status,
            @RequestHeader("Authorization") String authHeader) {
        memberService.updateMemberStatus(orgId, memberId, status, extractUserId(authHeader));
        return ResponseEntity.ok(Map.of("message", "Status updated"));
    }

    @PutMapping("/{memberId}")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> updateEmployee(
            @PathVariable Long orgId, @PathVariable Long memberId,
            @Valid @RequestBody UpdateEmployeeRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(memberService.updateEmployee(orgId, memberId, request, extractUserId(authHeader)));
    }

    @PostMapping("/{memberId}/reset-password")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> resetPassword(
            @PathVariable Long orgId, @PathVariable Long memberId,
            @RequestHeader("Authorization") String authHeader) {
        String newPwd = memberService.resetEmployeePassword(orgId, memberId, extractUserId(authHeader));
        return ResponseEntity.ok(Map.of("message", "Password reset. Email sent to employee.", "tempPassword", newPwd));
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('ORGANIZER') and @orgSecurity.isOrganizer(#orgId, authentication)")
    public ResponseEntity<?> deleteEmployee(
            @PathVariable Long orgId, @PathVariable Long memberId,
            @RequestHeader("Authorization") String authHeader) {
        memberService.deleteEmployee(orgId, memberId, extractUserId(authHeader));
        return ResponseEntity.ok(Map.of("message", "Employee removed"));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Unauthorized");
        Long userId = jwtUtil.extractUserId(authHeader.substring(7));
        if (userId == null) throw new RuntimeException("Invalid token");
        return userId;
    }
}