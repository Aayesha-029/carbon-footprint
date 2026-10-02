package com.ecotrack.carbon.security;

import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.UserRepository;
import com.ecotrack.carbon.service.NotificationService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        // Optional: picture = (String) attributes.get("picture");

        log.info("🔐 Google OAuth login: email={}, name={}", email, name);

        // Check if user exists, if not create one
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("✅ Existing user found: {}", user.getEmail());
        } else {
            // Create new user
            user = new User();
            user.setEmail(email);
            user.setFullName(name != null ? name : email.split("@")[0]);
            user.setPasswordHash(""); // No password for OAuth users
            user.setRole("USER");
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            log.info("✅ New user created via OAuth: {}", user.getEmail());
            // Send welcome email
            notificationService.sendWelcomeEmail(user);
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        // Redirect to frontend with token
        String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + token +
                             "&user=" + user.getFullName() +
                             "&role=" + user.getRole() +
                             "&id=" + user.getId();

        log.info("🔀 Redirecting to: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    }
}