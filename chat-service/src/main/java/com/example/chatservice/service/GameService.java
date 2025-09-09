package com.example.chatservice.service;

import com.example.chatservice.model.CaroGame;
import com.example.chatservice.model.GamePlayer;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    
    // Store active games by gameId
    private final Map<String, CaroGame> activeGames = new ConcurrentHashMap<>();
    
    // Store game invitations (gameId -> inviterUserId)
    private final Map<String, Long> gameInvitations = new ConcurrentHashMap<>();
    
    // Store user's current game (userId -> gameId)
    private final Map<Long, String> userCurrentGame = new ConcurrentHashMap<>();
    
    public CaroGame createGameInvitation(Long inviterUserId, String inviterName, Long invitedUserId, String invitedName) {
        // Create new game
        GamePlayer player1 = new GamePlayer(inviterUserId, inviterName, "X");
        GamePlayer player2 = new GamePlayer(invitedUserId, invitedName, "O");
        
        CaroGame game = new CaroGame(player1, player2);
        game.setStatus(CaroGame.GameStatus.WAITING);
        
        // Store invitation
        activeGames.put(game.getGameId(), game);
        gameInvitations.put(game.getGameId(), inviterUserId);
        
        return game;
    }
    
    public CaroGame acceptGameInvitation(String gameId, Long userId) {
        CaroGame game = activeGames.get(gameId);
        if (game == null) {
            return null;
        }
        
        // Verify that this user is one of the players
        if (!userId.equals(game.getPlayer1().getId()) && !userId.equals(game.getPlayer2().getId())) {
            return null;
        }
        
        // Start the game
        game.setStatus(CaroGame.GameStatus.PLAYING);
        
        // Remove invitation
        gameInvitations.remove(gameId);
        
        // Set current game for both players
        userCurrentGame.put(game.getPlayer1().getId(), gameId);
        userCurrentGame.put(game.getPlayer2().getId(), gameId);
        
        return game;
    }
    
    public void declineGameInvitation(String gameId, Long userId) {
        CaroGame game = activeGames.get(gameId);
        if (game == null) {
            return;
        }
        
        // Remove the game and invitation
        activeGames.remove(gameId);
        gameInvitations.remove(gameId);
    }
    
    public CaroGame makeMove(String gameId, Long userId, int row, int col) {
        CaroGame game = activeGames.get(gameId);
        if (game == null) {
            return null;
        }
        
        // Get player symbol
        String symbol = game.getSymbolByPlayerId(userId);
        if (symbol == null) {
            return null;
        }
        
        // Make the move
        boolean success = game.makeMove(row, col, symbol);
        if (!success) {
            return null;
        }
        
        // If game is finished, clean up
        if (game.getStatus() == CaroGame.GameStatus.FINISHED) {
            userCurrentGame.remove(game.getPlayer1().getId());
            userCurrentGame.remove(game.getPlayer2().getId());
        }
        
        return game;
    }
    
    public void quitGame(String gameId, Long userId) {
        CaroGame game = activeGames.get(gameId);
        if (game == null) {
            return;
        }
        
        // End the game with the other player as winner
        if (userId.equals(game.getPlayer1().getId())) {
            game.setWinner("O");
        } else if (userId.equals(game.getPlayer2().getId())) {
            game.setWinner("X");
        }
        
        game.setStatus(CaroGame.GameStatus.FINISHED);
        
        // Clean up
        activeGames.remove(gameId);
        userCurrentGame.remove(game.getPlayer1().getId());
        userCurrentGame.remove(game.getPlayer2().getId());
    }
    
    public CaroGame getGame(String gameId) {
        return activeGames.get(gameId);
    }
    
    public String getUserCurrentGame(Long userId) {
        return userCurrentGame.get(userId);
    }
    
    public boolean isUserInGame(Long userId) {
        return userCurrentGame.containsKey(userId);
    }
    
    public Long getOpponentId(String gameId, Long userId) {
        CaroGame game = activeGames.get(gameId);
        if (game == null) {
            return null;
        }
        
        if (userId.equals(game.getPlayer1().getId())) {
            return game.getPlayer2().getId();
        } else if (userId.equals(game.getPlayer2().getId())) {
            return game.getPlayer1().getId();
        }
        
        return null;
    }
    
    // Clean up when user disconnects
    public void handleUserDisconnect(Long userId) {
        String gameId = userCurrentGame.get(userId);
        if (gameId != null) {
            quitGame(gameId, userId);
        }
    }
}