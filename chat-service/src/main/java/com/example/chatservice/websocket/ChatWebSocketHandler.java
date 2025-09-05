package com.example.chatservice.websocket;

import com.example.chatservice.model.ChatMessage;
import com.example.chatservice.model.OnlineUser;
import com.example.chatservice.service.ChatService;
import com.example.chatservice.service.OnlineUserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private final ChatService chatService;
    private final OnlineUserService onlineUserService;
    
    public ChatWebSocketHandler(ChatService chatService, OnlineUserService onlineUserService) {
        this.chatService = chatService;
        this.onlineUserService = onlineUserService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            sessions.put(session.getId(), session);
            sessionUserMap.put(session.getId(), Long.parseLong(userId));
            
            // Add user to online list
            onlineUserService.addOnlineUser(Long.parseLong(userId));
            
            logger.info("WebSocket connection established for user: {}", userId);
            
            // Send online users list to the connected user
            sendOnlineUsersToUser(session);
            
            // Broadcast user joined to all other users
            broadcastUserJoined(Long.parseLong(userId));
        } else {
            session.close();
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        if (message instanceof TextMessage textMessage) {
            try {
                JsonNode jsonNode = objectMapper.readTree(textMessage.getPayload());
                String type = jsonNode.get("type").asText();
                
                switch (type) {
                    case "join":
                        handleJoin(session, jsonNode);
                        break;
                    case "chat_message":
                        handleChatMessage(session, jsonNode);
                        break;
                    default:
                        logger.warn("Unknown message type: {}", type);
                }
            } catch (Exception e) {
                logger.error("Error handling message: ", e);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("Transport error for session {}: ", session.getId(), exception);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        Long userId = sessionUserMap.remove(session.getId());
        sessions.remove(session.getId());
        
        if (userId != null) {
            // Remove user from online list
            onlineUserService.removeOnlineUser(userId);
            
            logger.info("WebSocket connection closed for user: {}", userId);
            
            // Broadcast user left to all other users
            broadcastUserLeft(userId);
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private void handleJoin(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = jsonNode.get("userId").asLong();
        onlineUserService.addOnlineUser(userId);
        sendOnlineUsersToUser(session);
    }

    private void handleChatMessage(WebSocketSession session, JsonNode jsonNode) {
        try {
            Long senderId = sessionUserMap.get(session.getId());
            Long receiverId = jsonNode.get("receiverId").asLong();
            String messageText = jsonNode.get("message").asText();
            
            if (senderId != null && messageText != null && !messageText.trim().isEmpty()) {
                // Save message to database
                ChatMessage chatMessage = chatService.saveMessage(senderId, receiverId, messageText);
                
                // Send message to receiver if online
                WebSocketSession receiverSession = getUserSession(receiverId);
                if (receiverSession != null) {
                    sendChatMessageToUser(receiverSession, chatMessage);
                }
                
                // Send confirmation to sender
                sendChatMessageToUser(session, chatMessage);
                
                logger.info("Chat message sent from {} to {}: {}", senderId, receiverId, messageText);
            }
        } catch (Exception e) {
            logger.error("Error handling chat message: ", e);
        }
    }

    private void sendOnlineUsersToUser(WebSocketSession session) throws IOException {
        List<OnlineUser> onlineUsers = onlineUserService.getOnlineUsers();
        
        Map<String, Object> message = Map.of(
            "type", "online_users",
            "users", onlineUsers
        );
        
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
    }

    private void broadcastUserJoined(Long userId) {
        OnlineUser user = onlineUserService.getOnlineUser(userId);
        if (user != null) {
            Map<String, Object> message = Map.of(
                "type", "user_joined",
                "user", user
            );
            
            broadcast(message, userId);
        }
    }

    private void broadcastUserLeft(Long userId) {
        Map<String, Object> message = Map.of(
            "type", "user_left",
            "userId", userId
        );
        
        broadcast(message, userId);
    }

    private void sendChatMessageToUser(WebSocketSession session, ChatMessage chatMessage) {
        try {
            Map<String, Object> message = Map.of(
                "type", "chat_message",
                "message", Map.of(
                    "id", chatMessage.getId(),
                    "senderId", chatMessage.getSenderId(),
                    "receiverId", chatMessage.getReceiverId(),
                    "message", chatMessage.getMessage(),
                    "timestamp", chatMessage.getTimestamp(),
                    "read", chatMessage.getIsRead()
                )
            );
            
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
        } catch (IOException e) {
            logger.error("Error sending chat message to user: ", e);
        }
    }

    private void broadcast(Map<String, Object> message, Long excludeUserId) {
        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(message);
        } catch (IOException e) {
            logger.error("Error serializing broadcast message: ", e);
            return;
        }
        
        sessions.values().parallelStream().forEach(session -> {
            Long sessionUserId = sessionUserMap.get(session.getId());
            if (sessionUserId != null && !sessionUserId.equals(excludeUserId)) {
                try {
                    session.sendMessage(new TextMessage(messageJson));
                } catch (IOException e) {
                    logger.error("Error sending broadcast message to session {}: ", session.getId(), e);
                }
            }
        });
    }

    private WebSocketSession getUserSession(Long userId) {
        return sessions.values().stream()
            .filter(session -> userId.equals(sessionUserMap.get(session.getId())))
            .findFirst()
            .orElse(null);
    }

    private String getUserIdFromSession(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String[] params = uri.getQuery().split("&");
            for (String param : params) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2 && "userId".equals(keyValue[0])) {
                    return keyValue[1];
                }
            }
        }
        return null;
    }
}