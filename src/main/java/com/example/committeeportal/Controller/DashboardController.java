package com.example.committeeportal.Controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.committeeportal.Entity.Event;
import com.example.committeeportal.Repository.BookingRepository;
import com.example.committeeportal.Repository.CommitteeRepository;
import com.example.committeeportal.Repository.EventRepository;
import com.example.committeeportal.Repository.VenueRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Dashboard", description = "Operations related to administrative dashboard statistics")
@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private CommitteeRepository committeeRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Operation(summary = "Get overall statistics for admin dashboard")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalEvents = eventRepository.count();
        long pendingApprovals = eventRepository.findByStatus("PENDING_APPROVAL").size();
        long approvedEvents = eventRepository.findByStatus("APPROVED").size();
        long rejectedEvents = eventRepository.findByStatus("REJECTED").size();
        long totalCommittees = committeeRepository.count();
        long totalVenues = venueRepository.count();
        long activeBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getEventDate().isAfter(LocalDate.now().minusDays(1)))
                .count();
        long upcomingEvents = eventRepository.findAll().stream()
                .filter(e -> e.getEventDate() != null && e.getEventDate().isAfter(LocalDate.now()))
                .count();

        stats.put("totalEvents", totalEvents);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("approvedEvents", approvedEvents);
        stats.put("rejectedEvents", rejectedEvents);
        stats.put("totalCommittees", totalCommittees);
        stats.put("totalVenues", totalVenues);
        stats.put("activeBookings", activeBookings);
        stats.put("upcomingEvents", upcomingEvents);

        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get chart data for admin dashboard")
    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getChartData() {
        Map<String, Object> chartData = new HashMap<>();

        // Events per month (simple logic for demonstration)
        List<Event> allEvents = eventRepository.findAll();
        Map<String, Long> eventsByMonth = allEvents.stream()
                .filter(e -> e.getEventDate() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getEventDate().getMonth().toString(),
                        Collectors.counting()
                ));
        chartData.put("eventsPerMonth", eventsByMonth);

        // Approved vs Rejected
        Map<String, Long> approvalStats = new HashMap<>();
        approvalStats.put("Approved", (long) eventRepository.findByStatus("APPROVED").size());
        approvalStats.put("Rejected", (long) eventRepository.findByStatus("REJECTED").size());
        approvalStats.put("Pending", (long) eventRepository.findByStatus("PENDING_APPROVAL").size());
        chartData.put("approvalAnalytics", approvalStats);

        // Venue Usage (top booked venues)
        Map<String, Long> venueUsage = bookingRepository.findAll().stream()
                .filter(b -> b.getVenue() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getVenue().getVenueName(),
                        Collectors.counting()
                ));
        chartData.put("venueUsage", venueUsage);

        return ResponseEntity.ok(chartData);
    }
}
