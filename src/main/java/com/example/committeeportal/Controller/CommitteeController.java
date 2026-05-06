    package com.example.committeeportal.Controller;

    import java.util.List;
    import java.util.Optional;

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.beans.factory.annotation.Autowired;
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
    import com.example.committeeportal.Entity.Committee;
    import com.example.committeeportal.Repository.CommitteeRepository;
    import com.example.committeeportal.ResponseBean.ErrorResponse;
    import com.example.committeeportal.ResponseBean.SuccessResponse;
    import com.example.committeeportal.Service.AuthService;

    import io.swagger.v3.oas.annotations.Operation;
    import io.swagger.v3.oas.annotations.tags.Tag;
    import jakarta.validation.Valid;

    @Tag(name = "committe", description = "Operations related to committe")
    @RestController
    @RequestMapping("/api/committees")
    public class CommitteeController {
         private static final Logger logger = LoggerFactory.getLogger(CommitteeController.class);
        
        @Autowired
        private CommitteeRepository committeeRepository;
        
        @Autowired
        private AuthService authService;
        
        // Get all committees
        @Operation(summary = "Get all committee")
        @GetMapping 
        public ResponseEntity<List<Committee>> getAllCommittees() {
            logger.info("Fetching all committees");
            try {
                List<Committee> committees = committeeRepository.findAll();
                
                if (committees.isEmpty()) {
                    logger.info("No committees found");
                    return ResponseEntity.ok(committees);
                }
                logger.info("Found {} committees", committees.size());
                return ResponseEntity.ok(committees);
            } catch (Exception e) {
                logger.error("Error fetching committees", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Get committee by ID
        @Operation(summary = "Get all committee by id")
        @GetMapping("/{id}")
        public ResponseEntity<Committee> getCommitteeById(@PathVariable Long id) {
            logger.info("Fetching committee with ID {}", id);
            try {
                Optional<Committee> committeeData = committeeRepository.findById(id);
                
                if (committeeData.isPresent()) {
                    return ResponseEntity.ok(committeeData.get());
                } else {
                    logger.warn("Committee with ID {} not found", id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                }
            } catch (Exception e) {
                logger.error("Error fetching committee with ID {}", id, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Register a new committee
        @Operation(summary = "Register a new committee")
        @PostMapping("/register")
        public ResponseEntity<?> registerCommittee(@Valid @RequestBody Committee committee, BindingResult bindingResult) {
            logger.info("Registering new committee: {}", committee.getCommitteeName());
            
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
                // Check if committee name already exists
                if (committeeRepository.existsByCommitteeNameIgnoreCase(committee.getCommitteeName())) {
                    logger.warn("Committee name {} already exists", committee.getCommitteeName());
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("Conflict", "Committee name already exists"));
                }
                
                // Check if email already exists
                if (committee.getContactEmail() != null && 
                    committeeRepository.existsByContactEmailIgnoreCase(committee.getContactEmail())) {
                    logger.warn("Email {} already exists", committee.getContactEmail());
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("Conflict", "Email already registered"));
                }
                
                // Register with encrypted password
                Committee savedCommittee = authService.registerCommittee(committee);
                logger.info("Committee {} registered successfully with ID {}", savedCommittee.getCommitteeName(), savedCommittee.getId());
                return ResponseEntity.status(HttpStatus.CREATED).body(savedCommittee);
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid registration data: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid Data", e.getMessage()));
            } catch (Exception e) {
                logger.error("Error registering committee {}", committee.getCommitteeName(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Create a new committee
        @Operation(summary = "Create a new committee")
        @PostMapping
        public ResponseEntity<Committee> createCommittee(@RequestBody Committee committee) {
            logger.info("Creating new committee: {}", committee.getCommitteeName());
            try {
                // Check if committee name already exists
                if (committeeRepository.existsByCommitteeNameIgnoreCase(committee.getCommitteeName())) {
                    logger.warn("Committee name {} already exists", committee.getCommitteeName());
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
                
                // Check if email already exists
                if (committee.getContactEmail() != null && 
                    committeeRepository.existsByContactEmailIgnoreCase(committee.getContactEmail())) {
                    logger.warn("Email {} already exists", committee.getContactEmail());
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
                
                // Register with encrypted password
                Committee savedCommittee = authService.registerCommittee(committee);
                logger.info("Committee {} created successfully with ID {}", savedCommittee.getCommitteeName(), savedCommittee.getId());
                return ResponseEntity.status(HttpStatus.CREATED).body(savedCommittee);
            } catch (Exception e) {
                logger.error("Error creating committee {}", committee.getCommitteeName(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Update an existing committee
        @Operation(summary = "Replace committee by id (PUT)")
        @PutMapping("/{id}")
        public ResponseEntity<Committee> updateCommittee(
            
                @PathVariable Long id, @RequestBody Committee committee) {
                logger.info("Updating committee with ID {}", id); 
            try {
                Optional<Committee> committeeData = committeeRepository.findById(id);
                
                if (committeeData.isPresent()) {
                    Committee existingCommittee = committeeData.get();
                    
                    // Update fields if they are not null in the request
                    if (committee.getCommitteeName() != null) {
                        existingCommittee.setCommitteeName(committee.getCommitteeName());
                    }
                    if (committee.getHeadOfCommittee() != null) {
                        existingCommittee.setHeadOfCommittee(committee.getHeadOfCommittee());
                    }
                    if (committee.getContactEmail() != null) {
                        existingCommittee.setContactEmail(committee.getContactEmail());
                    }
                    if (committee.getPassword() != null) {
                        // Use AuthService to encrypt password
                        authService.updateCommitteePassword(id, committee.getPassword());
                    }
                    
                    Committee updatedCommittee = committeeRepository.save(existingCommittee);
                    logger.info("Committee with ID {} updated successfully", id);

                    return ResponseEntity.ok(updatedCommittee);
                } else {
                    logger.warn("Committee with ID {} not found", id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                }
            } catch (Exception e) {
                logger.error("Error updating committee with ID {}", id, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Delete a committee
        @Operation(summary = "Delete committee by id")
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteCommittee(@PathVariable Long id) {
            logger.info("Deleting committee with ID {}", id);
            try {
                Optional<Committee> committeeData = committeeRepository.findById(id);
                
                if (committeeData.isPresent()) {
                    committeeRepository.deleteById(id);
                    logger.info("Committee with ID {} deleted successfully", id);
                    return ResponseEntity.ok().build();
                } else {
                    logger.warn("Committee with ID {} not found", id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                }
            } catch (Exception e) {
                logger.error("Error deleting committee with ID {}", id, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Search committees by name
        @Operation(summary = "Get all booking by name")
        @GetMapping("/search")
        public ResponseEntity<List<Committee>> searchCommitteesByName(
                
                @RequestParam("name") String name) {
                logger.info("Searching committees with name containing '{}'", name);
            try {
                List<Committee> committees = committeeRepository.findByCommitteeNameContainingIgnoreCase(name);
                logger.info("Found {} committees matching '{}'", committees.size(), name);
                return ResponseEntity.ok(committees);
            } catch (Exception e) {
                logger.error("Error searching committees with name containing '{}'", name, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        // Login endpoint
        @Operation(summary = "login user")
        @PostMapping("/login")
        public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
            logger.info("Login attempt for email: {}", loginRequest.getEmail()); 
            try {
                LoginResponse loginResponse = authService.loginCommittee(loginRequest);
                return ResponseEntity.ok(loginResponse);
            } catch (IllegalArgumentException e) {
                logger.warn("Login failed: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            } catch (Exception e) {
                logger.error("Error during login for email {}", loginRequest.getEmail(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
    
    @Operation(summary = "Patch a single field of committee")    
    @PatchMapping("/{id}")
    public ResponseEntity<Committee> patchCommittee(
            @PathVariable Long id, @RequestBody Committee committee) {
                logger.info("Patching committee with ID {}", id);
        try {
            Optional<Committee> committeeData = committeeRepository.findById(id);
            
            if (committeeData.isPresent()) {
                Committee existingCommittee = committeeData.get();
                
                // Update only provided (non-null) fields
                if (committee.getCommitteeName() != null) {
                    existingCommittee.setCommitteeName(committee.getCommitteeName());
                }
                if (committee.getHeadOfCommittee() != null) {
                    existingCommittee.setHeadOfCommittee(committee.getHeadOfCommittee());
                }
                if (committee.getContactEmail() != null) {
                    existingCommittee.setContactEmail(committee.getContactEmail());
                }
                if (committee.getPassword() != null) {
                    // Use AuthService to encrypt password
                    authService.updateCommitteePassword(id, committee.getPassword());
                }
                
                Committee updatedCommittee = committeeRepository.save(existingCommittee);
                logger.info("Committee with ID {} patched successfully", id);
                return ResponseEntity.ok(updatedCommittee);
            } else {
                logger.warn("Committee with ID {} not found", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error patching committee with ID {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Reset password endpoint for committees
    @Operation(summary = "Reset committee password")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        logger.info("Password reset request for committee email: {}", request.getEmail());
        try {
            if (request.getEmail() == null || request.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
            }
            if (request.getNewPassword() == null || request.getNewPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("New password is required"));
            }
            
            Committee committee = committeeRepository.findFirstByContactEmailIgnoreCase(request.getEmail());
            if (committee == null) {
                logger.warn("Password reset failed: Committee not found for email: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Committee not found with this email"));
            }
            
            authService.updateCommitteePassword(committee.getId(), request.getNewPassword());
            
            logger.info("Password reset successful for committee email: {}", request.getEmail());
            return ResponseEntity.ok(new SuccessResponse("Password reset successfully"));
        } catch (Exception e) {
            logger.error("Error during password reset for email {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Error resetting password"));
        }
    }
        
    }