package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.TripRequest;
import com.interim.SmartTransport.dto.TripSearchRequest;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<List<Trip>> createTrip(@RequestAttribute("userEmail") String email,
                                                 @Valid @RequestBody TripRequest request) {
        return ResponseEntity.ok(tripService.createTrip(email, request));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Trip>> searchTrips(TripSearchRequest request,
                                                  @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(tripService.searchTrips(request, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTrip(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Trip>> getMyTrips(@RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(tripService.getDriverTrips(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable Long id,
                                           @RequestAttribute("userEmail") String email,
                                           @Valid @RequestBody TripRequest request) {
        return ResponseEntity.ok(tripService.updateTrip(id, email, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelTrip(@PathVariable Long id,
                                           @RequestAttribute("userEmail") String email) {
        tripService.cancelTrip(id, email);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<Trip> startTrip(@PathVariable Long id,
                                          @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(tripService.startTrip(id, email));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Trip> completeTrip(@PathVariable Long id,
                                              @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(tripService.completeTrip(id, email));
    }

    @GetMapping("/{id}/siblings")
    public ResponseEntity<List<Trip>> getSiblingTrips(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getSiblingTrips(id));
    }

    @GetMapping("/locations/origins")
    public ResponseEntity<List<String>> getOrigins() {
        return ResponseEntity.ok(tripService.getDistinctOrigins());
    }

    @GetMapping("/locations/destinations")
    public ResponseEntity<List<String>> getDestinations() {
        return ResponseEntity.ok(tripService.getDistinctDestinations());
    }
}

