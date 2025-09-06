package com.example.chatservice.websocket;

import com.example.chatservice.model.ChatMessage;
import com.example.chatservice.model.OnlineUser;
import com.example.chatservice.model.CaroGame;
import com.example.chatservice.service.ChatService;
import com.example.chatservice.service.OnlineUserService;
import com.example.chatservice.service.GameService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Store play again requests (gameId -> Set<userId>)
    private final Map<String, Set<Long>> playAgainRequests = new ConcurrentHashMap<>();
    
    // Store session scoreboards (gameId -> scoreboard)
    private final Map<String, Map<String, Integer>> gameScoreboards = new ConcurrentHashMap<>();
    
    private final ChatService chatService;
    private final OnlineUserService onlineUserService;
    private final GameService gameService;
    
    public ChatWebSocketHandler(ChatService chatService, OnlineUserService onlineUserService, GameService gameService) {
        this.chatService = chatService;
        this.onlineUserService = onlineUserService;
        this.gameService = gameService;
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
                    case "send_game_invitation":
                        handleSendGameInvitation(session, jsonNode);
                        break;
                    case "accept_game_invitation":
                        handleAcceptGameInvitation(session, jsonNode);
                        break;
                    case "decline_game_invitation":
                        handleDeclineGameInvitation(session, jsonNode);
                        break;
                    case "game_move":
                        handleGameMove(session, jsonNode);
                        break;
                    case "quit_game":
                        handleQuitGame(session, jsonNode);
                        break;
                    case "play_again_request":
                        handlePlayAgainRequest(session, jsonNode);
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
            // Handle game disconnect
            gameService.handleUserDisconnect(userId);
            
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
                logger.info("Looking for receiver {}, found session: {}", receiverId, receiverSession != null);
                if (receiverSession != null) {
                    logger.info("Sending message to receiver {}", receiverId);
                    sendChatMessageToUser(receiverSession, chatMessage);
                } else {
                    logger.warn("Receiver {} is not online", receiverId);
                }
                
                // Send confirmation to sender
                logger.info("Sending confirmation to sender {}", senderId);
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
            logger.info("Preparing to send chat message to session {}: {}", session.getId(), chatMessage.getMessage());
            Map<String, Object> message = Map.of(
                "type", "chat_message",
                "message", Map.of(
                    "id", chatMessage.getId(),
                    "senderId", chatMessage.getSenderId(),
                    "receiverId", chatMessage.getReceiverId(),
                    "message", chatMessage.getMessage(),
                    "timestamp", chatMessage.getTimestamp().toString(),
                    "read", chatMessage.getIsRead()
                )
            );
            
            String messageJson = objectMapper.writeValueAsString(message);
            logger.info("Sending WebSocket message: {}", messageJson);
            session.sendMessage(new TextMessage(messageJson));
            logger.info("WebSocket message sent successfully");
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
    
    // Game-related handlers
    private void handleSendGameInvitation(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long inviterUserId = sessionUserMap.get(session.getId());
        Long invitedUserId = jsonNode.get("data").get("toUserId").asLong();
        
        if (inviterUserId == null) {
            return;
        }
        
        // Get user names
        OnlineUser inviter = onlineUserService.getOnlineUser(inviterUserId);
        OnlineUser invited = onlineUserService.getOnlineUser(invitedUserId);
        
        if (inviter == null || invited == null) {
            return;
        }
        
        // Create game invitation
        CaroGame game = gameService.createGameInvitation(
            inviterUserId, inviter.getName(),
            invitedUserId, invited.getName()
        );
        
        // Send invitation to the invited user
        WebSocketSession invitedSession = getUserSession(invitedUserId);
        if (invitedSession != null) {
            Map<String, Object> message = Map.of(
                "type", "game_invitation",
                "data", Map.of(
                    "gameId", game.getGameId(),
                    "fromUser", Map.of(
                        "id", inviter.getId(),
                        "name", inviter.getName()
                    ),
                    "toUser", Map.of(
                        "id", invited.getId(),
                        "name", invited.getName()
                    ),
                    "timestamp", LocalDateTime.now().toString()
                )
            );
            
            String messageJson = objectMapper.writeValueAsString(message);
            invitedSession.sendMessage(new TextMessage(messageJson));
        }
        
        logger.info("Game invitation sent from user {} to user {}", inviterUserId, invitedUserId);
    }
    
    private void handleAcceptGameInvitation(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = sessionUserMap.get(session.getId());
        String gameId = jsonNode.get("data").get("gameId").asText();
        
        if (userId == null) {
            return;
        }
        
        // Accept the game
        CaroGame game = gameService.acceptGameInvitation(gameId, userId);
        if (game == null) {
            return;
        }
        
        // Initialize scoreboard for new game
        Map<String, Integer> scoreboard = gameScoreboards.computeIfAbsent(gameId, k -> {
            Map<String, Integer> newScoreboard = new HashMap<>();
            newScoreboard.put("player1Wins", 0);
            newScoreboard.put("player2Wins", 0);
            newScoreboard.put("draws", 0);
            return newScoreboard;
        });
        
        // Notify both players that game started
        broadcastGameStartWithScoreboard(game, scoreboard);
        
        logger.info("Game {} started between players {} and {}", 
            gameId, game.getPlayer1().getId(), game.getPlayer2().getId());
    }
    
    private void handleDeclineGameInvitation(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = sessionUserMap.get(session.getId());
        String gameId = jsonNode.get("data").get("gameId").asText();
        
        if (userId == null) {
            return;
        }
        
        gameService.declineGameInvitation(gameId, userId);
        
        logger.info("Game invitation {} declined by user {}", gameId, userId);
    }
    
    private void handleGameMove(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = sessionUserMap.get(session.getId());
        String gameId = jsonNode.get("data").get("gameId").asText();
        int row = jsonNode.get("data").get("row").asInt();
        int col = jsonNode.get("data").get("col").asInt();
        
        if (userId == null) {
            return;
        }
        
        // Make the move
        CaroGame game = gameService.makeMove(gameId, userId, row, col);
        if (game == null) {
            return;
        }
        
        // Broadcast move to both players
        broadcastGameMove(game, row, col);
        
        // If game finished, broadcast game end
        if (game.getStatus() == CaroGame.GameStatus.FINISHED) {
            updateScoreboardAndBroadcastGameEnd(game);
        }
        
        logger.info("Move made in game {} by user {} at position [{}, {}]", gameId, userId, row, col);
    }
    
    private void handleQuitGame(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = sessionUserMap.get(session.getId());
        String gameId = jsonNode.get("data").get("gameId").asText();
        
        if (userId == null) {
            return;
        }
        
        gameService.quitGame(gameId, userId);
        
        // Get opponent and notify
        Long opponentId = gameService.getOpponentId(gameId, userId);
        if (opponentId != null) {
            WebSocketSession opponentSession = getUserSession(opponentId);
            if (opponentSession != null) {
                Map<String, Object> message = Map.of(
                    "type", "game_end",
                    "data", Map.of(
                        "winner", gameService.getGame(gameId) != null ? 
                                 gameService.getGame(gameId).getWinner() : null,
                        "reason", "opponent_quit"
                    )
                );
                
                String messageJson = objectMapper.writeValueAsString(message);
                opponentSession.sendMessage(new TextMessage(messageJson));
            }
        }
        
        logger.info("User {} quit game {}", userId, gameId);
    }
    
    private void handlePlayAgainRequest(WebSocketSession session, JsonNode jsonNode) throws IOException {
        Long userId = sessionUserMap.get(session.getId());
        String gameId = jsonNode.get("data").get("gameId").asText();
        
        if (userId == null) {
            return;
        }
        
        // Add user to play again requests
        playAgainRequests.computeIfAbsent(gameId, k -> new HashSet<>()).add(userId);
        
        // Get the other player
        Long opponentId = gameService.getOpponentId(gameId, userId);
        if (opponentId == null) {
            return;
        }
        
        // Check if both players requested play again
        Set<Long> requests = playAgainRequests.get(gameId);
        if (requests.contains(userId) && requests.contains(opponentId)) {
            // Both players agreed, start new game
            startNewGame(gameId, userId, opponentId);
            playAgainRequests.remove(gameId);
        } else {
            // Send play again request to opponent
            WebSocketSession opponentSession = getUserSession(opponentId);
            if (opponentSession != null) {
                Map<String, Object> message = Map.of(
                    "type", "play_again_request",
                    "data", Map.of(
                        "gameId", gameId,
                        "requesterUserId", userId
                    )
                );
                
                String messageJson = objectMapper.writeValueAsString(message);
                opponentSession.sendMessage(new TextMessage(messageJson));
            }
        }
        
        logger.info("Play again request from user {} for game {}", userId, gameId);
    }
    
    private void startNewGame(String oldGameId, Long player1Id, Long player2Id) throws IOException {
        // Get player names
        OnlineUser player1 = onlineUserService.getOnlineUser(player1Id);
        OnlineUser player2 = onlineUserService.getOnlineUser(player2Id);
        
        if (player1 == null || player2 == null) {
            return;
        }
        
        // Create new game
        CaroGame newGame = gameService.createGameInvitation(
            player1Id, player1.getName(),
            player2Id, player2.getName()
        );
        
        // Accept immediately to start playing
        gameService.acceptGameInvitation(newGame.getGameId(), player2Id);
        
        // Get/update scoreboard
        Map<String, Integer> scoreboard = gameScoreboards.computeIfAbsent(oldGameId, k -> {
            Map<String, Integer> newScoreboard = new HashMap<>();
            newScoreboard.put("player1Wins", 0);
            newScoreboard.put("player2Wins", 0);
            newScoreboard.put("draws", 0);
            return newScoreboard;
        });
        
        // Transfer scoreboard to new game
        gameScoreboards.put(newGame.getGameId(), scoreboard);
        
        // Broadcast game start with scoreboard
        broadcastGameStartWithScoreboard(newGame, scoreboard);
        
        logger.info("New game {} started between players {} and {} with scoreboard", 
            newGame.getGameId(), player1Id, player2Id);
    }
    
    private void broadcastGameStartWithScoreboard(CaroGame game, Map<String, Integer> scoreboard) throws IOException {
        Map<String, Object> message = Map.of(
            "type", "game_start",
            "data", Map.of(
                "gameId", game.getGameId(),
                "currentPlayer", game.getCurrentPlayer(),
                "players", Map.of(
                    "player1", Map.of(
                        "id", game.getPlayer1().getId(),
                        "name", game.getPlayer1().getName(),
                        "symbol", game.getPlayer1().getSymbol()
                    ),
                    "player2", Map.of(
                        "id", game.getPlayer2().getId(),
                        "name", game.getPlayer2().getName(),
                        "symbol", game.getPlayer2().getSymbol()
                    )
                ),
                "scoreboard", scoreboard
            )
        );
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        // Send to both players
        WebSocketSession player1Session = getUserSession(game.getPlayer1().getId());
        WebSocketSession player2Session = getUserSession(game.getPlayer2().getId());
        
        if (player1Session != null) {
            player1Session.sendMessage(new TextMessage(messageJson));
        }
        if (player2Session != null) {
            player2Session.sendMessage(new TextMessage(messageJson));
        }
    }
    
    private void updateScoreboardAndBroadcastGameEnd(CaroGame game) throws IOException {
        String gameId = game.getGameId();
        Map<String, Integer> scoreboard = gameScoreboards.computeIfAbsent(gameId, k -> {
            Map<String, Integer> newScoreboard = new HashMap<>();
            newScoreboard.put("player1Wins", 0);
            newScoreboard.put("player2Wins", 0);
            newScoreboard.put("draws", 0);
            return newScoreboard;
        });
        
        // Update scoreboard based on winner
        String winner = game.getWinner();
        if (winner != null) {
            if ("X".equals(winner)) {
                scoreboard.put("player1Wins", scoreboard.get("player1Wins") + 1);
            } else if ("O".equals(winner)) {
                scoreboard.put("player2Wins", scoreboard.get("player2Wins") + 1);
            }
        } else {
            // Draw
            scoreboard.put("draws", scoreboard.get("draws") + 1);
        }
        
        // Broadcast game end with updated scoreboard
        Map<String, Object> gameData = new HashMap<>();
        gameData.put("gameId", game.getGameId());
        gameData.put("winner", game.getWinner());
        gameData.put("winningLine", game.getWinningLine());
        gameData.put("status", "finished");
        gameData.put("scoreboard", scoreboard);
        
        Map<String, Object> message = Map.of(
            "type", "game_end",
            "data", gameData
        );
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        // Send to both players
        WebSocketSession player1Session = getUserSession(game.getPlayer1().getId());
        WebSocketSession player2Session = getUserSession(game.getPlayer2().getId());
        
        if (player1Session != null) {
            player1Session.sendMessage(new TextMessage(messageJson));
        }
        if (player2Session != null) {
            player2Session.sendMessage(new TextMessage(messageJson));
        }
    }
    
    private void broadcastGameStart(CaroGame game) throws IOException {
        Map<String, Object> message = Map.of(
            "type", "game_start",
            "data", Map.of(
                "gameId", game.getGameId(),
                "currentPlayer", game.getCurrentPlayer(),
                "players", Map.of(
                    "player1", Map.of(
                        "id", game.getPlayer1().getId(),
                        "name", game.getPlayer1().getName(),
                        "symbol", game.getPlayer1().getSymbol()
                    ),
                    "player2", Map.of(
                        "id", game.getPlayer2().getId(),
                        "name", game.getPlayer2().getName(),
                        "symbol", game.getPlayer2().getSymbol()
                    )
                )
            )
        );
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        // Send to both players
        WebSocketSession player1Session = getUserSession(game.getPlayer1().getId());
        WebSocketSession player2Session = getUserSession(game.getPlayer2().getId());
        
        if (player1Session != null) {
            player1Session.sendMessage(new TextMessage(messageJson));
        }
        if (player2Session != null) {
            player2Session.sendMessage(new TextMessage(messageJson));
        }
    }
    
    private void broadcastGameMove(CaroGame game, int row, int col) throws IOException {
        Map<String, Object> gameData = new HashMap<>();
        gameData.put("gameId", game.getGameId());
        gameData.put("board", game.getBoard());
        gameData.put("currentPlayer", game.getCurrentPlayer());
        gameData.put("status", game.getStatus().toString());
        gameData.put("winner", game.getWinner());
        gameData.put("winningLine", game.getWinningLine());
        
        Map<String, Object> lastMove = new HashMap<>();
        lastMove.put("row", row);
        lastMove.put("col", col);
        gameData.put("lastMove", lastMove);
        
        Map<String, Object> message = Map.of(
            "type", "game_move",
            "data", gameData
        );
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        // Send to both players
        WebSocketSession player1Session = getUserSession(game.getPlayer1().getId());
        WebSocketSession player2Session = getUserSession(game.getPlayer2().getId());
        
        if (player1Session != null) {
            player1Session.sendMessage(new TextMessage(messageJson));
        }
        if (player2Session != null) {
            player2Session.sendMessage(new TextMessage(messageJson));
        }
    }
    
    private void broadcastGameEnd(CaroGame game) throws IOException {
        Map<String, Object> gameData = new HashMap<>();
        gameData.put("gameId", game.getGameId());
        gameData.put("winner", game.getWinner());
        gameData.put("winningLine", game.getWinningLine());
        gameData.put("status", "finished");
        
        Map<String, Object> message = Map.of(
            "type", "game_end",
            "data", gameData
        );
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        // Send to both players
        WebSocketSession player1Session = getUserSession(game.getPlayer1().getId());
        WebSocketSession player2Session = getUserSession(game.getPlayer2().getId());
        
        if (player1Session != null) {
            player1Session.sendMessage(new TextMessage(messageJson));
        }
        if (player2Session != null) {
            player2Session.sendMessage(new TextMessage(messageJson));
        }
    }
}