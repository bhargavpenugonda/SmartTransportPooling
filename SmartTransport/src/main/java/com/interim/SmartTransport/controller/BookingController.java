package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.BookingRequest;
import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/{tripId}")
    public ResponseEntity<Booking> requestBooking(@PathVariable Long tripId,
                                                  @RequestBody BookingRequest request,
                                                  @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(bookingService.requestBooking(tripId, email,
                request.getSeats(), request.getBookingType(), request.getBookedDays()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable Long id,
                                                  @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(bookingService.approveBooking(id, email));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(@PathVariable Long id,
                                                 @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, email));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(bookingService.getPassengerBookings(email));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Booking>> getTripBookings(@PathVariable Long tripId) {
        return ResponseEntity.ok(bookingService.getTripBookings(tripId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id,
                                                  @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, email));
    }
}

