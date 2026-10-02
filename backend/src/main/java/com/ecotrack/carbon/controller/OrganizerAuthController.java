package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.OrganizerRegisterRequest;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.MemberService;
import com.ecotrack.carbon.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Slf4j
public class OrganizerAuthController {

    private final OrganizationService organizationService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerOrganizer(@Valid @RequestBody OrganizerRegisterRequest request) {
        try {
            Map<String, Object> userInfo = organizationService.registerOrganizer(request);

            // Generate JWT token
            String token = jwtUtil.generateToken(
                    (String) userInfo.get("email"),
                    (String) userInfo.get("role"),
                    (Long) userInfo.get("id")
            );

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", Map.of(
                    "id", userInfo.get("id"),
                    "email", userInfo.get("email"),
                    "fullName", userInfo.get("fullName"),
                    "role", userInfo.get("role")
            ));
            response.put("organization", Map.of(
                    "id", userInfo.get("organizationId"),
                    "name", userInfo.get("organizationName")
            ));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Organizer registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}