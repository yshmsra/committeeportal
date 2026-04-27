package com.example.committeeportal.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.committeeportal.DTO.AuthValidationResponse;
import com.example.committeeportal.Security.JwtUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "auth", description = "Authentication endpoints")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Validate JWT token and check if user is still authenticated
     * This endpoint is called on page refresh to verify session validity
     */
    @Operation(summary = "Validate JWT token")
    @GetMapping("/validate")
    public ResponseEntity<AuthValidationResponse> validateToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        logger.info("Token validation request received");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Invalid authorization header format");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthValidationResponse(false, "Invalid authorization header"));
        }

        try {
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Validate token signature and expiry
            if (!jwtUtil.validateToken(token)) {
                logger.warn("Token validation failed - invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthValidationResponse(false, "Token is invalid or expired"));
            }

            // Extract user info from token
            Long userId = jwtUtil.extractUserId(token);
            String email = jwtUtil.extractEmail(token);

            if (userId == null || email == null) {
                logger.warn("Could not extract user info from token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthValidationResponse(false, "Invalid token payload"));
            }

            logger.info("Token validated successfully for userId: {}", userId);
            return ResponseEntity.ok(new AuthValidationResponse(true, "Token is valid", userId, email));

        } catch (Exception e) {
            logger.error("Error during token validation", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthValidationResponse(false, "Token validation error: " + e.getMessage()));
        }
    }
}
