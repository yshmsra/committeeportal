package com.example.committeeportal.DTO;

import java.time.LocalTime;

public class TimeSlotDetail {
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean available;
    private String bookedByCommittee;  // Committee name if booked
    private String bookedEventName;     // Event name if booked

    public TimeSlotDetail(LocalTime startTime, LocalTime endTime, boolean available) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.available = available;
        this.bookedByCommittee = null;
        this.bookedEventName = null;
    }

    public TimeSlotDetail(LocalTime startTime, LocalTime endTime, boolean available, 
                         String bookedByCommittee, String bookedEventName) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.available = available;
        this.bookedByCommittee = bookedByCommittee;
        this.bookedEventName = bookedEventName;
    }

    // Getters and Setters
    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getBookedByCommittee() {
        return bookedByCommittee;
    }

    public void setBookedByCommittee(String bookedByCommittee) {
        this.bookedByCommittee = bookedByCommittee;
    }

    public String getBookedEventName() {
        return bookedEventName;
    }

    public void setBookedEventName(String bookedEventName) {
        this.bookedEventName = bookedEventName;
    }
}
