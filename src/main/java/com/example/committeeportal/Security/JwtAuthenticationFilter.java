package com.example.committeeportal.Security;

import java.io.IOException;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String token = extractTokenFromRequest(request);
            logger.info("JWT Filter - Method: {}, Path: {}, Token present: {}", request.getMethod(), request.getRequestURI(), token != null);

            if (token != null && jwtUtil.validateToken(token)) {
                String email = jwtUtil.extractEmail(token);
                Long userId = jwtUtil.extractUserId(token);
                String role = jwtUtil.extractRole(token);

                if (email != null) {
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(email, null, new ArrayList<>());
                    authToken.setDetails(userId);
                    
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("JWT token validated for user: {}", email);
                }
            } else if (token != null) {
                logger.warn("JWT token validation failed for path: {}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.error("Error processing JWT token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        logger.debug("Authorization header value: {}", bearerToken);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            logger.debug("Bearer token found, extracting...");
            return bearerToken.substring(7);
        }
        logger.debug("No bearer token found in request");
        return null;
    }
}
