package com.example.committeeportal.DTO;

import java.util.List;

public class VenueAvailabilityDTO {
    private Long venueId;
    private String venueName;
    private String venueLocation;
    private Integer capacity;
    private String facilities;
    private List<TimeSlotDetail> timeSlots;

    public VenueAvailabilityDTO() {}

    public VenueAvailabilityDTO(Long venueId, String venueName, String venueLocation, 
                                Integer capacity, String facilities, List<TimeSlotDetail> timeSlots) {
        this.venueId = venueId;
        this.venueName = venueName;
        this.venueLocation = venueLocation;
        this.capacity = capacity;
        this.facilities = facilities;
        this.timeSlots = timeSlots;
    }

    // Getters and Setters
    public Long getVenueId() {
        return venueId;
    }

    public void setVenueId(Long venueId) {
        this.venueId = venueId;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getVenueLocation() {
        return venueLocation;
    }

    public void setVenueLocation(String venueLocation) {
        this.venueLocation = venueLocation;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getFacilities() {
        return facilities;
    }

    public void setFacilities(String facilities) {
        this.facilities = facilities;
    }

    public List<TimeSlotDetail> getTimeSlots() {
        return timeSlots;
    }

    public void setTimeSlots(List<TimeSlotDetail> timeSlots) {
        this.timeSlots = timeSlots;
    }
}
