package com.example.committeeportal.Controller;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.committeeportal.DTO.LoginRequest;
import com.example.committeeportal.DTO.LoginResponse;
import com.example.committeeportal.DTO.PasswordResetRequest;
import com.example.committeeportal.Entity.Approver;
import com.example.committeeportal.Repository.ApproverRepository;
import com.example.committeeportal.ResponseBean.ErrorResponse;
import com.example.committeeportal.ResponseBean.SuccessResponse;
import com.example.committeeportal.Service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Approvers", description = "Operations related to approvers")
@RestController
@RequestMapping("/api/approvers")
public class ApproverController {

    private static final Logger logger = LoggerFactory.getLogger(ApproverController.class);

    private final ApproverRepository approverRepository;
    private final AuthService authService;

    public ApproverController(ApproverRepository approverRepository, AuthService authService) {
        this.approverRepository = approverRepository;
        this.authService = authService;
    }

    // ✅ GET all approvers
    @Operation(summary = "Get all approvals")
    @GetMapping
    public List<Approver> getAllApprovers() {
        logger.info("Fetching all approvers from the database");
        return approverRepository.findAll();
    }

    // ✅ GET approver by ID
    @Operation(summary = "Get all approvals by id")
    @GetMapping("/{id}")
    public ResponseEntity<Approver> getApproverById(@PathVariable Long id) {
        logger.info("Fetching approver with ID: {}", id);
        Optional<Approver> approver = approverRepository.findById(id);
        return approver.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ GET search approvers by name
    @Operation(summary = "Search approvers by name")
    @GetMapping("/search")
    public ResponseEntity<List<Approver>> searchApprovers(@RequestParam("name") String name) {
        logger.info("Searching approvers with name containing '{}'", name);
        try {
            List<Approver> approvers = approverRepository.findByNameContainingIgnoreCase(name);
            logger.info("Found {} approvers matching '{}'", approvers.size(), name);
            return ResponseEntity.ok(approvers);
        } catch (Exception e) {
            logger.error("Error searching approvers with name containing '{}'", name, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ POST register new approver
    @Operation(summary = "Register a new approver")
    @PostMapping("/register")
    public ResponseEntity<?> registerApprover(@Valid @RequestBody Approver approver, BindingResult bindingResult) {
        logger.info("Registering new approver: {}", approver.getName());
        
        // Check for validation errors
        if (bindingResult.hasErrors()) {
            StringBuilder errorMessage = new StringBuilder();
            bindingResult.getAllErrors().forEach(error -> {
                errorMessage.append(error.getDefaultMessage()).append("; ");
            });
            logger.warn("Validation errors: {}", errorMessage);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Validation failed", errorMessage.toString()));
        }
        
        try {
            // Check if email already exists
            if (approverRepository.existsByEmailIgnoreCase(approver.getEmail())) {
                logger.warn("Email {} already exists", approver.getEmail());
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Conflict", "Email already registered"));
            }
            
            Approver saved = authService.registerApprover(approver);
            logger.debug("Approver registered successfully with ID: {}", saved.getApproverId());
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.warn("Error registering approver: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid Data", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error registering approver", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Server Error", "An error occurred during registration"));
        }
    }

    // ✅ POST create new approver
    @Operation(summary = "Create a new approval")
    @PostMapping
    public ResponseEntity<Approver> createApprover(@RequestBody Approver approver) {
        logger.info("Creating new approver: {}", approver.getName());
        try {
            Approver saved = authService.registerApprover(approver);
            logger.debug("Approver created successfully with ID: {}", saved.getApproverId());
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.warn("Error creating approver: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating approver", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }




    // ✅ PUT update (replace entire object)
@Operation(summary = "Replace approval by id (PUT)")    
@PutMapping("/{id}")
public ResponseEntity<?> updateApprover(
        @PathVariable Long id,
        @Valid @RequestBody Approver approverDetails,
        BindingResult bindingResult) {
    logger.info("Updating approver with ID: {}", id);
    
    if (bindingResult.hasErrors()) {
        StringBuilder errorMsg = new StringBuilder();
        bindingResult.getAllErrors().forEach(e -> errorMsg.append(e.getDefaultMessage()).append("; "));
        logger.warn("Validation failed for update ID {}: {}", id, errorMsg);
        return ResponseEntity.badRequest().body(new ErrorResponse("Validation failed", errorMsg.toString()));
    }
    
    return approverRepository.findById(id)
            .map(existing -> {
                existing.setName(approverDetails.getName());
                existing.setEmail(approverDetails.getEmail());
                existing.setRole(approverDetails.getRole());
                existing.setDigitalSignature(approverDetails.getDigitalSignature());
                
                // Use AuthService to encrypt password if provided
                if (approverDetails.getPassword() != null) {
                    authService.updateApproverPassword(id, approverDetails.getPassword());
                }
                
                Approver updated = approverRepository.save(existing);
                logger.info("Approver with ID {} updated successfully", id);
                return ResponseEntity.ok(updated);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
}

    // ✅ PATCH partial update
@Operation(summary = "Patch a single field of approval")    
@PatchMapping("/{id}")
public ResponseEntity<?> patchApprover(
        @PathVariable Long id,
        @Valid @RequestBody Approver partial,
        BindingResult bindingResult) {
    logger.info("Patching approver with ID: {}", id);
    
    if (bindingResult.hasErrors()) {
        StringBuilder errorMsg = new StringBuilder();
        bindingResult.getAllErrors().forEach(e -> errorMsg.append(e.getDefaultMessage()).append("; "));
        logger.warn("Validation failed for patch ID {}: {}", id, errorMsg);
        return ResponseEntity.badRequest().body(new ErrorResponse("Validation failed", errorMsg.toString()));
    }
    return approverRepository.findById(id)
            .map(existing -> {
                if (partial.getName() != null) {
                    existing.setName(partial.getName());
                }
                if (partial.getEmail() != null) {
                    existing.setEmail(partial.getEmail());
                }
                if (partial.getRole() != null) {
                    existing.setRole(partial.getRole());
                }
                if (partial.getDigitalSignature() != null) {
                    existing.setDigitalSignature(partial.getDigitalSignature());
                }
                if (partial.getPassword() != null) {
                    // Use AuthService to encrypt password
                    authService.updateApproverPassword(id, partial.getPassword());
                }
                Approver updated = approverRepository.save(existing);
                logger.info("Approver with ID {} partially updated", id);
                return ResponseEntity.ok(updated);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
}

    // ✅ DELETE approver
    @Operation(summary = "Delete approval by id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApprover(@PathVariable Long id) {
        logger.info("Deleting approver with ID: {}", id);
        return approverRepository.findById(id)
                .map(existing -> {
                    approverRepository.delete(existing);
                    logger.info("Approver with ID {} deleted successfully", id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ Login endpoint for approvers
    @Operation(summary = "Login approver")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for approver email: {}", loginRequest.getEmail());
        try {
            LoginResponse response = authService.loginApprover(loginRequest);
            logger.info("Login successful for approver email: {}", loginRequest.getEmail());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Login failed for email: {} - {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            logger.error("Error during login for email {}", loginRequest.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Reset password endpoint for approvers
    @Operation(summary = "Reset approver password")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        logger.info("Password reset request for approver email: {}", request.getEmail());
        try {
            if (request.getEmail() == null || request.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
            }
            if (request.getNewPassword() == null || request.getNewPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("New password is required"));
            }
            
            Optional<Approver> approverOptional = approverRepository.findFirstByEmail(request.getEmail());
            if (!approverOptional.isPresent()) {
                logger.warn("Password reset failed: Approver not found for email: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Approver not found with this email"));
            }
            
            Approver approver = approverOptional.get();
            authService.updateApproverPassword(approver.getApproverId(), request.getNewPassword());
            
            logger.info("Password reset successful for approver email: {}", request.getEmail());
            return ResponseEntity.ok(new SuccessResponse("Password reset successfully"));
        } catch (Exception e) {
            logger.error("Error during password reset for email {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Error resetting password"));
        }
    }
}