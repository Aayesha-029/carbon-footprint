package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.AcceptInvitationRequest;
import com.ecotrack.carbon.repository.OrganizationInvitationRepository;
import com.ecotrack.carbon.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final MemberService memberService;
    private final OrganizationInvitationRepository invitationRepository;

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        var invitation = invitationRepository.findByToken(token);
        if (invitation.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invalid token"));
        }
        var inv = invitation.get();
        if ("ACCEPTED".equals(inv.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invitation already accepted"));
        }
        if (inv.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invitation expired"));
        }
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "email", inv.getEmail(),
                "organizationName", inv.getOrganization().getName()
        ));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        try {
            memberService.acceptInvitation(request);
            return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}