package com.interim.SmartTransport.security;

import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Allow CORS preflight requests through
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Public endpoints - skip JWT check
        if (path.startsWith("/api/auth/register") || path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/forgot-password") || path.startsWith("/api/auth/reset-password")
                || path.startsWith("/api/auth/verify-email") || path.startsWith("/api/auth/resend-verification")
                || path.startsWith("/api/auth/profile/picture/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = getJwtFromRequest(request);

        if (!StringUtils.hasText(jwt) || !tokenProvider.validateToken(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Unauthorized - invalid or missing token\"}");
            return;
        }

        String email = tokenProvider.getEmailFromToken(jwt);
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Unauthorized - user not found\"}");
            return;
        }

        User user = userOpt.get();

        // Admin-only endpoints
        if (path.startsWith("/api/admin") && !"ADMIN".equals(user.getRole().name())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Forbidden - admin access required\"}");
            return;
        }

        // Set user info as request attributes for controllers
        request.setAttribute("userEmail", email);
        request.setAttribute("userRole", user.getRole().name());

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

