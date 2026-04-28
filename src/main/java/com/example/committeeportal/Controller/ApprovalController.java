package com.example.committeeportal.Controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.committeeportal.Entity.Approval;
import com.example.committeeportal.Entity.Approver;
import com.example.committeeportal.Entity.Event;
import com.example.committeeportal.Entity.PermissionApplication;
import com.example.committeeportal.Repository.ApprovalRepository;
import com.example.committeeportal.Repository.ApproverRepository;
import com.example.committeeportal.Repository.EventRepository;
import com.example.committeeportal.Repository.PermissionApplicationRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


@Tag(name = "Approvals", description = "Operations related to approvals")
@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalController.class);
    
    @Autowired
    private ApprovalRepository approvalRepository;
    
    @Autowired
    private ApproverRepository approverRepository;
    
    @Autowired
    private PermissionApplicationRepository permissionApplicationRepository;
    
    @Autowired
    private EventRepository eventRepository;
    
    // GET all approvals
    @Operation(summary = "Get all approvals")
    @GetMapping
    public ResponseEntity<List<Approval>> getAllApprovals() {
        logger.info("Fetching all approvals...");
        try {
            List<Approval> approvals = approvalRepository.findAll();
            logger.debug("Total approvals fetched: {}", approvals.size());
            return ResponseEntity.ok(approvals);
        } catch (Exception e) {
            logger.error("Error fetching approvals: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET approval by ID
    @Operation(summary = "get approval by id")
    @GetMapping("/{id}")
    public ResponseEntity<Approval> getApprovalById(@PathVariable Long id) {
        logger.info("Fetching approval with ID: {}", id);
        try {
            Optional<Approval> approvalData = approvalRepository.findById(id);
            
            if (approvalData.isPresent()) {
                logger.debug("Approval found: {}", approvalData.get());
                return ResponseEntity.ok(approvalData.get());
            } else {
                logger.warn("Approval with ID {} not found", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error fetching approval by ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // POST create new approval
    @Operation(summary = "Create a new approval")
    @PostMapping
    public ResponseEntity<Approval> createApproval(@RequestBody Approval approval) {
        logger.info("Creating new approval...");
        try {
            // Validate approver
            if (approval.getApprover() != null && approval.getApprover().getApproverId() != null) {
                Optional<Approver> approver = approverRepository.findById(approval.getApprover().getApproverId());
                if (approver.isEmpty()) {
                    logger.warn("Approver with ID {} not found", approval.getApprover().getApproverId());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                approval.setApprover(approver.get());
            }
            // Validate permission application
            if (approval.getPermissionApplication() != null && approval.getPermissionApplication().getApplicationId() != null) {
                Optional<PermissionApplication> permissionApp = permissionApplicationRepository.findById(
                    approval.getPermissionApplication().getApplicationId());
                if (permissionApp.isEmpty()) {
                    logger.warn("Permission application with ID {} not found", approval.getPermissionApplication().getApplicationId());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                approval.setPermissionApplication(permissionApp.get());
            }
            
            // Set approval date if not provided
            if (approval.getApprovalDate() == null) {
                approval.setApprovalDate(LocalDate.now());
            }
            
            Approval savedApproval = approvalRepository.save(approval);
            logger.info("Approval created successfully with ID: {}", savedApproval.getApprovalId());
            return new ResponseEntity<>(savedApproval, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating approval: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // POST create approval for a specific permission application by a specific approver
    @Operation(summary = "Create  approval for specific permission application")
    @PostMapping("/{applicationId}/approver/{approverId}")
    public ResponseEntity<?> createApprovalForApplication(
            @PathVariable Long applicationId,
            @PathVariable Long approverId,
            @RequestBody Approval approvalDetails) {
        logger.info("Creating approval for Application ID: {} by Approver ID: {}", applicationId, approverId);        
        try {
            Optional<PermissionApplication> applicationOpt = permissionApplicationRepository.findById(applicationId);
            Optional<Approver> approverOpt = approverRepository.findById(approverId);
            
            if (applicationOpt.isEmpty() || approverOpt.isEmpty()) {
                logger.warn("Either Application ID {} or Approver ID {} not found", applicationId, approverId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Application or Approver not found"));
            }
            
            PermissionApplication application = applicationOpt.get();
            Approver approver = approverOpt.get();
            String newStatus = approvalDetails.getApprovalStatus();
            Event event = application.getEvent();

            // Check for conflict
            if (application.getStatus() != null && application.getStatus().equals(newStatus)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse("Application status is already set to " + newStatus));
            }

            // Update application status
            application.setStatus(newStatus);
            permissionApplicationRepository.save(application);
            logger.debug("Updated application {} status to {}", applicationId, newStatus);
            
            // Sync status with Event
            if (event != null) {
                event.setStatus(newStatus);
                eventRepository.save(event);
                logger.info("Synchronized Event ID {} status to {}", event.getEventId(), newStatus);
            }
            
            // Create approval record
            Approval approval = new Approval();
            approval.setPermissionApplication(application);
            approval.setApprover(approver);
            approval.setApprovalStatus(newStatus);
            approval.setRemarks(approvalDetails.getRemarks());
            approval.setApprovalDate(LocalDate.now());
            
            Approval savedApproval = approvalRepository.save(approval);
            logger.info("Approval created for Application ID {} successfully", applicationId);
            return new ResponseEntity<>(savedApproval, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating approval for Application ID {}: {}", applicationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // PUT update approval
    @Operation(summary = "Replace approval by id (PUT)")
    @PutMapping("/{id}")
    public ResponseEntity<Approval> updateApproval(@PathVariable Long id, @RequestBody Approval approval) {
        logger.info("Updating approval with ID: {}", id);
        try {
            Optional<Approval> approvalData = approvalRepository.findById(id);
            
            if (approvalData.isPresent()) {
                Approval existingApproval = approvalData.get();
                
                // Update the fields
                existingApproval.setApprovalStatus(approval.getApprovalStatus());
                existingApproval.setRemarks(approval.getRemarks());
                
                // Only update these if they're provided and valid
                if (approval.getApprover() != null && approval.getApprover().getApproverId() != null) {
                    Optional<Approver> approver = approverRepository.findById(approval.getApprover().getApproverId());
                    if (approver.isPresent()) {
                        existingApproval.setApprover(approver.get());
                    }
                }
                
                if (approval.getPermissionApplication() != null && approval.getPermissionApplication().getApplicationId() != null) {
                    Optional<PermissionApplication> permissionApp = permissionApplicationRepository.findById(
                        approval.getPermissionApplication().getApplicationId());
                    if (permissionApp.isPresent()) {
                        existingApproval.setPermissionApplication(permissionApp.get());
                    }
                }
                
                if (approval.getApprovalDate() != null) {
                    existingApproval.setApprovalDate(approval.getApprovalDate());
                }
                
                Approval updatedApproval = approvalRepository.save(existingApproval);
                logger.info("Approval ID {} updated successfully", id);
                return ResponseEntity.ok(updatedApproval);
            } else {
                logger.warn("Approval with ID {} not found for update", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error updating approval with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // PATCH partial update approval
    @Operation(summary = "Patch a single field of approval")
    @PatchMapping("/{id}")
    public ResponseEntity<Approval> patchApproval(@PathVariable Long id, @RequestBody Approval approval) {
        logger.info("Partially updating approval with ID: {}", id);
        try {
            Optional<Approval> approvalData = approvalRepository.findById(id);
            
            if (approvalData.isPresent()) {
                Approval existingApproval = approvalData.get();
                
                // Only update fields that are provided
                if (approval.getApprovalStatus() != null) {
                    existingApproval.setApprovalStatus(approval.getApprovalStatus());
                }
                
                if (approval.getRemarks() != null) {
                    existingApproval.setRemarks(approval.getRemarks());
                }
                
                if (approval.getApprover() != null && approval.getApprover().getApproverId() != null) {
                    Optional<Approver> approver = approverRepository.findById(approval.getApprover().getApproverId());
                    if (approver.isPresent()) {
                        existingApproval.setApprover(approver.get());
                    }
                }
                
                if (approval.getPermissionApplication() != null && approval.getPermissionApplication().getApplicationId() != null) {
                    Optional<PermissionApplication> permissionApp = permissionApplicationRepository.findById(
                        approval.getPermissionApplication().getApplicationId());
                    if (permissionApp.isPresent()) {
                        existingApproval.setPermissionApplication(permissionApp.get());
                    }
                }
                
                if (approval.getApprovalDate() != null) {
                    existingApproval.setApprovalDate(approval.getApprovalDate());
                }
                
                Approval updatedApproval = approvalRepository.save(existingApproval);
                logger.info("Approval ID {} partially updated successfully", id);
                return ResponseEntity.ok(updatedApproval);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error patching approval with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // DELETE approval
    @Operation(summary = "Delete approval by id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApproval(@PathVariable Long id) {
        logger.info("Deleting approval with ID: {}", id);
        try {
            Optional<Approval> approvalData = approvalRepository.findById(id);
            
            if (approvalData.isPresent()) {
                approvalRepository.deleteById(id);
                logger.info("Approval ID {} deleted successfully", id);
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Approval with ID {} not found for deletion", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error deleting approval with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET all approvals for a specific permission application
    @Operation(summary = "Get all approvals for a specific permission")
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<Approval>> getApprovalsByApplication(@PathVariable Long applicationId) {
        logger.info("Fetching approvals for Application ID: {}", applicationId);
        try {
            // Check if the application exists
            if (!permissionApplicationRepository.existsById(applicationId)) {
                logger.warn("Permission Application ID {} not found", applicationId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Use the repository method we added
            List<Approval> approvals = approvalRepository.findByPermissionApplication_ApplicationId(applicationId);
            logger.debug("Fetched {} approvals for Application ID {}", approvals.size(), applicationId);
            return ResponseEntity.ok(approvals);
        } catch (Exception e) {
            logger.error("Error fetching approvals for Application ID {}: {}", applicationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET all approvals by a specific approver
    @Operation(summary = "Get all approvals by a specific approver")
    @GetMapping("/approver/{approverId}")
    public ResponseEntity<List<Approval>> getApprovalsByApprover(@PathVariable Long approverId) {
        logger.info("Fetching approvals by Approver ID: {}", approverId);
        try {
            // Check if the approver exists
            if (!approverRepository.existsById(approverId)) {
                logger.warn("Approver ID {} not found", approverId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Use the repository method we added
            List<Approval> approvals = approvalRepository.findByApprover_ApproverId(approverId);
            logger.debug("Fetched {} approvals for Approver ID {}", approvals.size(), approverId);
            return ResponseEntity.ok(approvals);
        } catch (Exception e) {
            logger.error("Error fetching approvals by Approver ID {}: {}", approverId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET all approvals by status
    @Operation(summary = "Get all approvals by a specific status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Approval>> getApprovalsByStatus(@PathVariable String status) {
        logger.info("Fetching approvals with status: {}", status);
        try {
            List<Approval> approvals = approvalRepository.findByApprovalStatus(status);
            logger.debug("Fetched {} approvals with status '{}'", approvals.size(), status);
            return ResponseEntity.ok(approvals);
        } catch (Exception e) {
            logger.error("Error fetching approvals by status '{}': {}", status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
