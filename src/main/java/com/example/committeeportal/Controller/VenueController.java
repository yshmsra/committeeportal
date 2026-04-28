package com.example.committeeportal.Controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.committeeportal.DTO.TimeSlotDetail;
import com.example.committeeportal.DTO.VenueAvailabilityDTO;
import com.example.committeeportal.Entity.Booking;
import com.example.committeeportal.Entity.Venue;
import com.example.committeeportal.Repository.BookingRepository;
import com.example.committeeportal.Repository.VenueRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "venue", description = "Operations related to venue")
@RestController
@RequestMapping("/api/venues")
public class VenueController {
    private static final Logger logger = LoggerFactory.getLogger(VenueController.class);
    
    @Autowired
    private VenueRepository venueRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    // GET - Get all venues
    @Operation(summary = "Get all venue")
    @GetMapping
    public ResponseEntity<List<Venue>> getAllVenues() {
        logger.info("Fetching all venues...");
        try {
            List<Venue> venues = venueRepository.findAll();
            logger.info("Found {} venues", venues.size());
            return ResponseEntity.ok(venues);
        } catch (Exception e) {
            logger.error("Error fetching venues: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET - Get venue by ID
    @Operation(summary = "Get all venue by id")
    @GetMapping("/{id}")
    public ResponseEntity<Venue> getVenueById(@PathVariable Long id) {
        logger.info("Fetching venue with ID: {}", id);
        try {
            Optional<Venue> venueData = venueRepository.findById(id);
            
            if (venueData.isPresent()) {
                logger.info("Venue found: {}", venueData.get().getVenueName());
                return ResponseEntity.ok(venueData.get());
            } else {
                logger.warn("Venue with ID {} not found", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error fetching venue by ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // POST - Create a new venue
    @Operation(summary = "Create a new venue")
    @PostMapping
    public ResponseEntity<Venue> createVenue(@RequestBody Venue venue) {
        logger.info("Creating new venue: {}", venue.getVenueName());
        try {
            // Check if venue name already exists
            if (venueRepository.existsByVenueNameIgnoreCase(venue.getVenueName())) {
                logger.warn("Venue with name '{}' already exists", venue.getVenueName());        
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            
            Venue savedVenue = venueRepository.save(venue);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedVenue);
        } catch (Exception e) {
            logger.error("Error creating venue: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // PUT - Update an existing venue
    @Operation(summary = "Replace venue by id (PUT)")
    @PutMapping("/{id}")
    public ResponseEntity<Venue> updateVenue(@PathVariable Long id, @RequestBody Venue venue) {
        logger.info("Updating venue with ID: {}", id);
        try {
            Optional<Venue> venueData = venueRepository.findById(id);
            
            if (venueData.isPresent()) {
                Venue existingVenue = venueData.get();
                
                // Update all fields
                existingVenue.setVenueName(venue.getVenueName());
                existingVenue.setVenueLocation(venue.getVenueLocation());
                existingVenue.setCapacity(venue.getCapacity());
                existingVenue.setAvailable(venue.getAvailable());
                existingVenue.setFacilities(venue.getFacilities());
                
                Venue updatedVenue = venueRepository.save(existingVenue);
                logger.info("Venue '{}' updated successfully", updatedVenue.getVenueName());
                return ResponseEntity.ok(updatedVenue);
            } else {
                logger.warn("Venue with ID {} not found for update", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error updating venue ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // PATCH - Partially update an existing venue
    @Operation(summary = "Patch a single field of venue")
    @PatchMapping("/{id}")
    public ResponseEntity<Venue> patchVenue(@PathVariable Long id, @RequestBody Venue venue) {
        logger.info("Partially updating venue with ID: {}", id);
        try {
            Optional<Venue> venueData = venueRepository.findById(id);
            
            if (venueData.isPresent()) {
                Venue existingVenue = venueData.get();
                
                // Update only provided (non-null) fields
                if (venue.getVenueName() != null) {
                    existingVenue.setVenueName(venue.getVenueName());
                }
                if (venue.getVenueLocation() != null) {
                    existingVenue.setVenueLocation(venue.getVenueLocation());
                }
                if (venue.getCapacity() != null) {
                    existingVenue.setCapacity(venue.getCapacity());
                }
                if (venue.getAvailable() != null) {
                    existingVenue.setAvailable(venue.getAvailable());
                }
                if (venue.getFacilities() != null) {
                    existingVenue.setFacilities(venue.getFacilities());
                }
                
                Venue updatedVenue = venueRepository.save(existingVenue);
                logger.info("Venue {} partially updated", id);
                return ResponseEntity.ok(updatedVenue);
            } else {
                logger.warn("Venue with ID {} not found for patch update", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error patching venue ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // DELETE - Delete a venue
    @Operation(summary = "Delete venue by id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVenue(@PathVariable Long id) {
        logger.info("Deleting venue with ID: {}", id);
        try {
            Optional<Venue> venueData = venueRepository.findById(id);
            
            if (venueData.isPresent()) {
                venueRepository.deleteById(id);
                logger.info("Venue with ID {} deleted successfully", id);
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Venue with ID {} not found for deletion", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            logger.error("Error deleting venue ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
 
 @Operation(summary = "Get all venue by name")   
 @GetMapping("/name/{name}")
public ResponseEntity<List<Venue>> searchVenuesByName(@PathVariable String name) {
    logger.info("Searching venues by name containing '{}'", name);
    try {
        List<Venue> venues = venueRepository.findByVenueNameContainingIgnoreCase(name);
        logger.info("Found {} venues matching name '{}'", venues.size(), name);
        return ResponseEntity.ok(venues);
    } catch (Exception e) {
        logger.error("Error searching venues by name '{}': {}", name, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}

// GET - Search venues by location
@Operation(summary = "Get all venues by the name")
@GetMapping("/location/{location}")
public ResponseEntity<List<Venue>> searchVenuesByLocation(@PathVariable String location) {
    logger.info("Searching venues by location containing '{}'", location);
    try {
        List<Venue> venues = venueRepository.findByVenueLocationContainingIgnoreCase(location);
        logger.info("Found {} venues at location '{}'", venues.size(), location);
        return ResponseEntity.ok(venues);
    } catch (Exception e) {
        logger.error("Error searching venues by location '{}': {}", location, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}


    // GET - Get available venues
    @Operation(summary = "Get all available venue")
    @GetMapping("/available")
    public ResponseEntity<List<Venue>> getAvailableVenues() {
        logger.info("Fetching available venues...");
        try {
            List<Venue> venues = venueRepository.findByAvailable(true);
            logger.info("Found {} available venues", venues.size());
            return ResponseEntity.ok(venues);
        } catch (Exception e) {
            logger.error("Error fetching available venues: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // GET - Get venues with minimum capacity
    @Operation(summary = "Get capacity of venue")
    @GetMapping("/capacity")
    public ResponseEntity<List<Venue>> getVenuesByCapacity(@RequestParam Integer minCapacity) {
        logger.info("Fetching venues with minimum capacity: {}", minCapacity);
        try {
            List<Venue> venues = venueRepository.findByCapacityGreaterThanEqual(minCapacity);
            logger.info("Found {} venues with capacity >= {}", venues.size(), minCapacity);
            return ResponseEntity.ok(venues);
        } catch (Exception e) {
            logger.error("Error fetching venues by capacity {}: {}", minCapacity, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET - Get available time slots for all venues on a specific date
    @Operation(summary = "Get available and booked time slots for all venues on a specific date with committee details")
    @GetMapping("/availability")
    public ResponseEntity<List<VenueAvailabilityDTO>> getVenueAvailability(@RequestParam String date) {
        logger.info("Fetching venue availability for date: {}", date);
        try {
            LocalDate eventDate = LocalDate.parse(date);
            List<Venue> allVenues = venueRepository.findAll();
            List<VenueAvailabilityDTO> availabilityList = new ArrayList<>();

            // Default time slots: 8 AM to 7 PM in 1-hour slots
            LocalTime dayStart = LocalTime.of(8, 0);
            LocalTime dayEnd = LocalTime.of(19, 0);

            for (Venue venue : allVenues) {
                List<TimeSlotDetail> timeSlots = new ArrayList<>();
                LocalTime currentSlot = dayStart;

                // Get all bookings for this venue on the given date
                List<Booking> bookings = bookingRepository.findBookingsByVenueAndDate(venue.getVenueId(), eventDate);

                // Generate 1-hour time slots
                while (currentSlot.isBefore(dayEnd)) {
                    LocalTime slotEnd = currentSlot.plusHours(1);

                    // Check if this slot is booked
                    boolean isAvailable = true;
                    String bookedByCommittee = null;
                    String bookedEventName = null;
                    
                    for (Booking booking : bookings) {
                        if (currentSlot.isBefore(booking.getEndTime()) && booking.getStartTime().isBefore(slotEnd)) {
                            isAvailable = false;
                            bookedEventName = booking.getEventName();
                            // Get committee name from the event
                            if (booking.getEvent() != null && booking.getEvent().getCommittee() != null) {
                                bookedByCommittee = booking.getEvent().getCommittee().getCommitteeName();
                            }
                            break;
                        }
                    }

                    if (isAvailable) {
                        timeSlots.add(new TimeSlotDetail(currentSlot, slotEnd, true));
                    } else {
                        timeSlots.add(new TimeSlotDetail(currentSlot, slotEnd, false, bookedByCommittee, bookedEventName));
                    }
                    
                    currentSlot = slotEnd;
                }

                VenueAvailabilityDTO dto = new VenueAvailabilityDTO(
                        venue.getVenueId(),
                        venue.getVenueName(),
                        venue.getVenueLocation(),
                        venue.getCapacity(),
                        venue.getFacilities(),
                        timeSlots
                );
                availabilityList.add(dto);
            }

            logger.info("Found availability for {} venues on {}", availabilityList.size(), eventDate);
            return ResponseEntity.ok(availabilityList);
        } catch (Exception e) {
            logger.error("Error fetching venue availability: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
