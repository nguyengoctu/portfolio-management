package com.example.chatservice.controller;

import com.example.chatservice.model.ChatMessage;
import com.example.chatservice.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    
    private final ChatMessageRepository chatMessageRepository;
    
    public ChatController(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }
    
    @GetMapping("/messages/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getRecentMessages(
            @PathVariable Long userId1, 
            @PathVariable Long userId2) {
        
        logger.info("Loading recent messages between users {} and {}", userId1, userId2);
        
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        
        List<ChatMessage> messages = chatMessageRepository.findMessagesBetweenUsersAfterTimestamp(
            userId1, userId2, oneDayAgo);
        
        logger.info("Found {} messages from last 24 hours", messages.size());
        
        return ResponseEntity.ok(messages);
    }
}