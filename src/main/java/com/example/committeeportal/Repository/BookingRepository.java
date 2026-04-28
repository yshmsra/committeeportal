package com.example.committeeportal.Repository;

import com.example.committeeportal.Entity.Booking;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Custom query methods can be added here if needed
    @Query("SELECT b FROM Booking b WHERE b.venue.venueId = :venueId AND b.eventDate = :eventDate")
    List<Booking> findBookingsByVenueAndDate(@Param("venueId") Long venueId,
                                             @Param("eventDate") LocalDate eventDate);

    java.util.Optional<Booking> findByEvent_EventId(Long eventId);
    
    void deleteByEvent_EventId(Long eventId);

}