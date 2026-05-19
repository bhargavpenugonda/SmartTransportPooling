package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.model.Notification;
import com.interim.SmartTransport.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(notificationService.getUserNotifications(email));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(email)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {
        notificationService.markAsRead(id, email);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @RequestAttribute("userEmail") String email) {
        notificationService.markAllRead(email);
        return ResponseEntity.ok().build();
    }
}
