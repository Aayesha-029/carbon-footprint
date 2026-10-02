package com.ecotrack.carbon.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    // Skip ONLY the exact public endpoints
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        boolean shouldSkip = path.equals("/api/auth/login") ||
                             path.equals("/api/auth/register") ||
                             path.equals("/api/auth/forgot-password") ||
                             path.equals("/api/auth/reset-password") ||
                             path.startsWith("/swagger-ui") ||
                             path.startsWith("/v3/api-docs") ||
                             path.startsWith("/actuator/health") ||
                             path.startsWith("/oauth2") ||
                             path.startsWith("/login/oauth2");
        if (shouldSkip) {
            log.info("⏩ Skipping filter for public path: {}", path);
        }
        return shouldSkip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String path = request.getRequestURI();

        log.info("🔍 JWT Filter processing protected path: {}", path);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("🚫 No token for protected endpoint: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        log.info("🔑 Token for {}: {}...", path, jwt.substring(0, Math.min(20, jwt.length())));

        String username = null;
        try {
            username = jwtUtil.extractUsername(jwt);
            log.info("✅ Extracted username: {}", username);
        } catch (Exception e) {
            log.error("❌ Failed to extract username: {}", e.getMessage(), e);
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                log.info("👤 Loaded UserDetails for: {}", userDetails.getUsername());

                if (jwtUtil.validateToken(jwt)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("✅ Authentication SET for user: {}", username);
                } else {
                    log.warn("❌ Token validation FAILED for user: {}", username);
                    filterChain.doFilter(request, response);
                    return;
                }
            } catch (Exception e) {
                log.error("❌ Error loading UserDetails: {}", e.getMessage(), e);
                filterChain.doFilter(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}