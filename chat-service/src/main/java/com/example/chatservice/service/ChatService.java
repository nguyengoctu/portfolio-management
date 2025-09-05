package com.example.chatservice.service;

import com.example.chatservice.model.ChatMessage;
import com.example.chatservice.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    public ChatMessage saveMessage(Long senderId, Long receiverId, String message) {
        ChatMessage chatMessage = new ChatMessage(senderId, receiverId, message);
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getMessagesForUser(Long userId, Long otherUserId) {
        return chatMessageRepository.findMessagesBetweenUsers(userId, otherUserId);
    }

    public void markMessagesAsRead(Long senderId, Long receiverId) {
        chatMessageRepository.markMessagesAsRead(senderId, receiverId);
    }

    public List<ChatMessage> getUnreadMessages(Long receiverId) {
        return chatMessageRepository.findUnreadMessagesForUser(receiverId);
    }
}