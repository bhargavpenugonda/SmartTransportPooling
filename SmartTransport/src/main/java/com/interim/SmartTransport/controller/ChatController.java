package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.ChatMessageDTO;
import com.interim.SmartTransport.dto.SendMessageRequest;
import com.interim.SmartTransport.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // Send message (passenger -> driver auto-detected, or specify receiverId)
    @PostMapping("/{tripId}")
    public ResponseEntity<ChatMessageDTO> sendMessage(
            @PathVariable Long tripId,
            @RequestParam(required = false) Long receiverId,
            @Valid @RequestBody SendMessageRequest request,
            @RequestAttribute("userEmail") String email) {

        ChatMessageDTO msg;
        if (receiverId != null) {
            msg = chatService.sendMessageToUser(tripId, email, receiverId, request.getContent());
        } else {
            msg = chatService.sendMessage(tripId, email, request.getContent());
        }

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + tripId, msg);

        return ResponseEntity.ok(msg);
    }

    // Get conversation for a trip
    @GetMapping("/{tripId}")
    public ResponseEntity<List<ChatMessageDTO>> getConversation(
            @PathVariable Long tripId,
            @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(chatService.getConversation(tripId, email));
    }

    // Mark all messages in trip as read
    @PutMapping("/{tripId}/read")
    public ResponseEntity<Void> markTripAsRead(
            @PathVariable Long tripId,
            @RequestAttribute("userEmail") String email) {
        chatService.markTripMessagesAsRead(tripId, email);
        return ResponseEntity.ok().build();
    }

    // Mark single message as read
    @PutMapping("/message/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long messageId,
            @RequestAttribute("userEmail") String email) {
        chatService.markAsRead(messageId, email);
        return ResponseEntity.ok().build();
    }

    // Get total unread count
    @GetMapping("/unread")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestAttribute("userEmail") String email) {
        return ResponseEntity.ok(Map.of("count", chatService.getUnreadCount(email)));
    }

    // WebSocket: send message via STOMP
    @MessageMapping("/chat/{tripId}")
    public void sendViaWebSocket(@DestinationVariable Long tripId,
                                 @Payload SendMessageRequest request,
                                 Principal principal) {
        ChatMessageDTO msg = chatService.sendMessage(tripId, principal.getName(), request.getContent());
        messagingTemplate.convertAndSend("/topic/chat/" + tripId, msg);
    }
}
