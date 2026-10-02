package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.ForgotPasswordRequest;
import com.ecotrack.carbon.dto.request.LoginRequest;
import com.ecotrack.carbon.dto.request.RegisterRequest;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.UserRepository;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    // ============ REGISTER ============
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Email already registered"));
            }

            User user = new User();
            user.setEmail(request.getEmail());
            user.setFullName(request.getFullName());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole("USER");
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);

            notificationService.sendWelcomeEmail(savedUser);
            notificationService.notifyRegistration(savedUser.getId(), savedUser.getFullName());

            String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole(), savedUser.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "token", token,
                    "user", Map.of(
                            "id", savedUser.getId(),
                            "email", savedUser.getEmail(),
                            "fullName", savedUser.getFullName(),
                            "role", savedUser.getRole()
                    )
            ));

        } catch (Exception e) {
            log.error("Registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    // ============ LOGIN ============
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Optional<User> userOptional = userRepository.findByEmailOrUsername(request.getEmail(), request.getEmail());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Account not found. Please sign up."));
            }

            User user = userOptional.get();
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid password. Please try again."));
            }

            notificationService.sendLoginAlertEmail(user);
            notificationService.notifyLogin(user.getId());

            String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "fullName", user.getFullName(),
                            "role", user.getRole()
                    )
            ));

        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    // ============ FORGOT PASSWORD ============
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            String email = request.getEmail();
            log.info("Forgot password requested for email: {}", email);

            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "If an account exists, a reset link has been sent."));
            }

            User user = userOptional.get();
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            log.info("Reset token generated for user: {}", user.getEmail());

            notificationService.sendPasswordResetEmail(user, resetToken);

            log.info("Password reset email sent to: {}", user.getEmail());

            return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email."));

        } catch (Exception e) {
            log.error("Forgot password error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send reset link. Please try again."));
        }
    }

    // ============ RESET PASSWORD ============
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
                                           @RequestParam String newPassword) {
        try {
            Optional<User> userOptional = userRepository.findByResetToken(token);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid or expired token"));
            }

            User user = userOptional.get();
            if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Token has expired"));
            }

            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);

            notificationService.sendPasswordResetSuccessEmail(user);

            return ResponseEntity.ok(Map.of("message", "Password reset successful"));

        } catch (Exception e) {
            log.error("Reset password error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reset password."));
        }
    }

    // ============ GET ALL USERS (ADMIN ONLY) ============
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        // SecurityConfig already enforces ADMIN role via .hasRole("ADMIN")
        List<User> users = userRepository.findAll();
        log.info("✅ Returning {} users", users.size());
        return ResponseEntity.ok(Map.of("users", users));
    }

    // ============ VALIDATE TOKEN (DEBUG) ============
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            boolean valid = jwtUtil.validateToken(token);
            String username = jwtUtil.extractUsername(token);
            Long userId = jwtUtil.extractUserId(token);
            return ResponseEntity.ok(Map.of(
                    "valid", valid,
                    "username", username,
                    "userId", userId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ============ TEST AUTH (DEBUG) ============
    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false, "message", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "username", authentication.getName(),
                "authorities", authentication.getAuthorities().stream()
                        .map(a -> a.getAuthority()).toList()
        ));
    }
}