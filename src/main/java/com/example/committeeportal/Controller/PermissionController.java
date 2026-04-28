package com.example.committeeportal.Controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.committeeportal.Entity.Approval;
import com.example.committeeportal.Entity.Approver;
import com.example.committeeportal.Entity.Booking;
import com.example.committeeportal.Entity.Event;
import com.example.committeeportal.Entity.PermissionApplication;
import com.example.committeeportal.Repository.ApprovalRepository;
import com.example.committeeportal.Repository.ApproverRepository;
import com.example.committeeportal.Repository.BookingRepository;
import com.example.committeeportal.Repository.EventRepository;
import com.example.committeeportal.Repository.PermissionApplicationRepository;
import com.example.committeeportal.ResponseBean.ErrorResponse;
import com.example.committeeportal.ResponseBean.SuccessResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "permission", description = "Operations related to permissions")
@RestController
@RequestMapping("/permissions")
public class PermissionController {

    private static final Logger logger = LoggerFactory.getLogger(PermissionController.class);

    @Value("${file.upload.dir:uploads/documents}")
    private String uploadDir;

    private final PermissionApplicationRepository permissionRepo;
    private final ApprovalRepository approvalRepo;
    private final ApproverRepository approverRepo;
    private final EventRepository eventRepo;
    private final BookingRepository bookingRepo;

    public PermissionController(PermissionApplicationRepository permissionRepo, ApprovalRepository approvalRepo,
            ApproverRepository approverRepo, EventRepository eventRepo, BookingRepository bookingRepo) {
        this.permissionRepo = permissionRepo;
        this.approvalRepo = approvalRepo;
        this.approverRepo = approverRepo;
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
    }

    // Get all permission applications
    @Operation(summary = "Get all permission")
    @GetMapping
    public List<PermissionApplication> getAllApplications() {
        logger.info("Fetching all permission applications");
        try {
            List<PermissionApplication> applications = permissionRepo.findAll();
            logger.info("Found {} applications", applications.size());
            return applications;
        } catch (Exception e) {
            logger.error("Error fetching permission applications", e);
            return List.of();
        }
    }

    // Get a permission application by its ID
    @Operation(summary = "Get all permission by id")
    @GetMapping("/{id}")
    public PermissionApplication getApplicationById(@PathVariable Long id) {
        logger.info("Fetching permission application with ID {}", id);
        try {
            Optional<PermissionApplication> application = permissionRepo.findById(id);
            if (application.isPresent()) {
                return application.get();
            } else {
                logger.warn("Permission application with ID {} not found", id);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching permission application with ID {}", id, e);
            return null;
        }
    }

    // Get all permission applications targeted at a specific approver
    @Operation(summary = "Get permission applications by approver id")
    @GetMapping("/approver/{approverId}")
    public List<PermissionApplication> getApplicationsByApprover(@PathVariable Long approverId) {
        logger.info("Fetching permission applications for approver ID {}", approverId);
        try {
            List<PermissionApplication> applications = permissionRepo.findByApprover_ApproverId(approverId);
            logger.info("Found {} targeted applications", applications.size());
            return applications;
        } catch (Exception e) {
            logger.error("Error fetching targeted applications", e);
            return List.of();
        }
    }

    // Submit a new permission application for an event to a specific approver
    @PostMapping("/submit/{eventId}/{approverId}")
    public PermissionApplication submitApplication(@PathVariable Long eventId, @PathVariable Long approverId,
            @RequestBody PermissionApplication application) {
        logger.info("Submitting permission application for event ID {} to approver ID {}", eventId, approverId);
        Optional<Event> eventOpt = eventRepo.findById(eventId);
        Optional<Approver> approverOpt = approverRepo.findById(approverId);

        if (eventOpt.isPresent() && approverOpt.isPresent()) {
            Event event = eventOpt.get();
            application.setEvent(event);
            application.setApprover(approverOpt.get());
            application.setUploadDate(LocalDate.now());
            application.setStatus("Submitted");

            // Sync status with Event
            event.setStatus("Pending");
            eventRepo.save(event);

            return permissionRepo.save(application);
        } else {
            logger.warn("Event with ID {} not found. Cannot submit application.", eventId);
            return null;
        }
    }

    // ✅ NEW: Submit permission application with documents BEFORE submission
    // (compulsory)
    @Operation(summary = "Submit permission application with attached documents")
    @PostMapping("/submit-with-documents")
    public ResponseEntity<?> submitApplicationWithDocuments(
            @RequestParam("eventId") Long eventId,
            @RequestParam("approverId") Long approverId,
            @RequestParam("files") MultipartFile[] files) {

        logger.info("Submitting permission application for event ID {} to approver ID {} with {} files",
                eventId, approverId, files.length);

        try {
            // Validate event and approver exist
            Optional<Event> eventOpt = eventRepo.findById(eventId);
            Optional<Approver> approverOpt = approverRepo.findById(approverId);

            if (!eventOpt.isPresent()) {
                logger.warn("Event with ID {} not found", eventId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Event not found"));
            }

            if (!approverOpt.isPresent()) {
                logger.warn("Approver with ID {} not found", approverId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Approver not found"));
            }

            // Validate at least one file is provided
            if (files == null || files.length == 0) {
                logger.warn("No files provided for application submission");
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("At least one document is required"));
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                logger.info("Created upload directory: {}", uploadDir);
            }

            // Process files and build comma-separated path string
            StringBuilder docPaths = new StringBuilder();

            for (MultipartFile file : files) {
                if (file.isEmpty())
                    continue;

                // Validate PDF
                if (!file.getContentType().equals("application/pdf")) {
                    logger.warn("Invalid file type for file: {}", file.getOriginalFilename());
                    return ResponseEntity.badRequest()
                            .body(new ErrorResponse("Only PDF files are allowed. File: " + file.getOriginalFilename()));
                }

                try {
                    // Generate unique filename
                    String uniqueFileName = UUID.randomUUID().toString() + ".pdf";
                    Path filePath = Paths.get(uploadDir, uniqueFileName);

                    // Save file to disk
                    Files.write(filePath, file.getBytes());
                    logger.info("File saved: {}", filePath);

                    // Build document path (relative path for storage in DB)
                    if (docPaths.length() > 0) {
                        docPaths.append(",");
                    }
                    docPaths.append("/documents/").append(uniqueFileName);

                } catch (IOException e) {
                    logger.error("Error saving file: {}", file.getOriginalFilename(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ErrorResponse("Failed to save file: " + file.getOriginalFilename()));
                }
            }

            // Create permission application with document paths
            Event event = eventOpt.get();
            Approver approver = approverOpt.get();

            PermissionApplication application = new PermissionApplication();
            application.setEvent(event);
            application.setApprover(approver);
            application.setUploadDate(LocalDate.now());
            application.setStatus("Submitted");
            application.setPermissionDoc(docPaths.toString()); // Store comma-separated paths

            // Sync status with Event
            event.setStatus("Pending");
            eventRepo.save(event);

            // Save application
            PermissionApplication savedApplication = permissionRepo.save(application);
            logger.info("Permission application created with ID {} and {} documents",
                    savedApplication.getApplicationId(), files.length);

            return ResponseEntity.ok(new SuccessResponse(
                    "Permission application submitted successfully with " + files.length + " document(s)"));

        } catch (Exception e) {
            logger.error("Error submitting permission application with documents: {}", e.getMessage(), e);
            String specificError = (e.getCause() != null) ? e.getCause().getMessage() : e.getMessage();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to submit: " + specificError));
        }
    }

    // Approve or reject a permission application
    @Operation(summary = "approve or reject a new permission")
    @PostMapping("/{applicationId}/approve/{approverId}")
    public ResponseEntity<?> approveApplication(@PathVariable Long applicationId, @PathVariable Long approverId,
            @RequestBody Approval approvalDetails) {
        Optional<PermissionApplication> applicationOpt = permissionRepo.findById(applicationId);
        logger.info("Approving/rejecting application ID {} by approver ID {}", applicationId, approverId);
        Optional<Approver> approverOpt = approverRepo.findById(approverId);

        if (applicationOpt.isEmpty() || approverOpt.isEmpty()) {
            if (applicationOpt.isEmpty())
                logger.warn("Application ID {} not found", applicationId);
            if (approverOpt.isEmpty())
                logger.warn("Approver ID {} not found", approverId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Application or Approver not found"));
        }

        PermissionApplication application = applicationOpt.get();
        String newStatus = approvalDetails.getApprovalStatus(); // e.g., "Approved" or "Rejected"
        Event event = application.getEvent();

        // ✅ CRITICAL: Conflict check before approval
        if ("APPROVED".equalsIgnoreCase(newStatus) && event != null) {
            if (event.getVenue() != null && event.getVenue().getVenueId() != null &&
                    event.getStartTime() != null && event.getEndTime() != null) {

                // Get all existing bookings for this venue and date
                List<Booking> conflictingBookings = bookingRepo.findBookingsByVenueAndDate(
                        event.getVenue().getVenueId(),
                        event.getEventDate());

                for (Booking existingBooking : conflictingBookings) {
                    // Check if time slots overlap (and it's not a booking for the same event)
                    if (!existingBooking.getEvent().getEventId().equals(event.getEventId()) &&
                            event.getStartTime().isBefore(existingBooking.getEndTime()) &&
                            existingBooking.getStartTime().isBefore(event.getEndTime())) {

                        logger.warn("Approval Conflict: Venue {} on {} is already booked during {} - {}",
                                event.getVenue().getVenueId(), event.getEventDate(),
                                existingBooking.getStartTime(), existingBooking.getEndTime());

                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(new ErrorResponse(
                                        "Cannot approve. The venue is already booked for another event at this time."));
                    }
                }
            }
        }

        // Update application status
        application.setStatus(newStatus);
        application.setRemarks(approvalDetails.getRemarks()); // Save remarks to application
        permissionRepo.save(application);
        logger.info("Application ID {} status updated to '{}' with remarks", applicationId, newStatus);

        // Sync status with Event
        if (event != null) {
            logger.info("Syncing status '{}' to Event ID {}", newStatus, event.getEventId());
            event.setStatus(newStatus);
            eventRepo.save(event);

            // ✅ HANDLE BOOKING BASED ON STATUS
            if ("APPROVED".equalsIgnoreCase(newStatus)) {
                // Check if already booked to avoid duplicates (safeguard)
                Optional<Booking> existingBooking = bookingRepo.findByEvent_EventId(event.getEventId());
                if (existingBooking.isEmpty()) {
                    if (event.getVenue() != null && event.getVenue().getVenueId() != null &&
                            event.getStartTime() != null && event.getEndTime() != null) {
                        try {
                            Booking booking = new Booking();
                            booking.setEventName(event.getEventName());
                            booking.setEventDescription(event.getDescription());
                            booking.setVenueName(event.getVenue().getVenueName());
                            booking.setVenueLocation(event.getVenue().getVenueLocation());
                            booking.setBookingDate(LocalDate.now());
                            booking.setEventDate(event.getEventDate());
                            booking.setStartTime(event.getStartTime());
                            booking.setEndTime(event.getEndTime());
                            booking.setEvent(event);
                            booking.setVenue(event.getVenue());
                            booking.setStatus("BOOKED");

                            bookingRepo.save(booking);
                            logger.info("✅ Booking created successfully upon approval for event: {}",
                                    event.getEventId());
                        } catch (Exception e) {
                            logger.error("❌ Error creating booking upon approval for event {}: {}", event.getEventId(),
                                    e.getMessage());
                        }
                    }
                }
            } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
                // Delete booking if it exists (in case it was previously approved)
                Optional<Booking> existingBooking = bookingRepo.findByEvent_EventId(event.getEventId());
                if (existingBooking.isPresent()) {
                    bookingRepo.delete(existingBooking.get());
                    logger.info("🗑️ Booking deleted for rejected event: {}", event.getEventId());
                }
            }
        }

        approvalDetails.setPermissionApplication(application);
        approvalDetails.setApprover(approverOpt.get());
        approvalDetails.setApprovalDate(LocalDate.now());
        Approval savedApproval = approvalRepo.save(approvalDetails);

        return ResponseEntity.ok(savedApproval);
    }

    // ✅ Download a permission document by filename
    @Operation(summary = "Download a permission document")
    @GetMapping("/documents/download/{filename}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String filename) {
        logger.info("Download request for file: {}", filename);

        try {
            // Construct the file path - filename should be UUID.pdf format
            Path filePath = Paths.get(uploadDir, filename);

            // Security check: ensure the file exists and is in the upload directory
            File file = filePath.toFile();
            if (!file.exists()) {
                logger.warn("File not found: {}", filePath);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Verify file is a PDF
            if (!filename.toLowerCase().endsWith(".pdf")) {
                logger.warn("Invalid file type requested: {}", filename);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Resource resource = new FileSystemResource(file);
            logger.info("Serving file: {}", filename);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            logger.error("Error downloading file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
