package com.example.chatservice.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CaroGame {
    private static final int BOARD_SIZE = 20;
    
    private String gameId;
    private GamePlayer player1; // X
    private GamePlayer player2; // O
    private String[][] board; // 20x20 board
    private String currentPlayer; // "X" or "O"
    private GameStatus status;
    private String winner;
    private List<int[]> winningLine;
    
    public enum GameStatus {
        WAITING, PLAYING, FINISHED
    }
    
    public CaroGame() {
        this.gameId = UUID.randomUUID().toString();
        this.board = new String[BOARD_SIZE][BOARD_SIZE];
        this.currentPlayer = "X"; // X always starts first
        this.status = GameStatus.WAITING;
        this.winningLine = new ArrayList<>();
        
        // Initialize empty board
        for (int i = 0; i < BOARD_SIZE; i++) {
            for (int j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = null;
            }
        }
    }
    
    public CaroGame(GamePlayer player1, GamePlayer player2) {
        this();
        this.player1 = player1;
        this.player2 = player2;
        this.status = GameStatus.PLAYING;
    }
    
    // Make a move
    public boolean makeMove(int row, int col, String symbol) {
        // Validate move
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return false;
        }
        
        if (board[row][col] != null) {
            return false; // Cell already occupied
        }
        
        if (!currentPlayer.equals(symbol)) {
            return false; // Not this player's turn
        }
        
        if (status != GameStatus.PLAYING) {
            return false; // Game not in progress
        }
        
        // Make the move
        board[row][col] = symbol;
        
        // Check for win
        if (checkWin(row, col, symbol)) {
            winner = symbol;
            status = GameStatus.FINISHED;
            return true;
        }
        
        // Check for draw
        if (isBoardFull()) {
            status = GameStatus.FINISHED;
            winner = null; // Draw
            return true;
        }
        
        // Switch player
        currentPlayer = currentPlayer.equals("X") ? "O" : "X";
        
        return true;
    }
    
    // Check if there's a winner (5 in a row)
    private boolean checkWin(int row, int col, String symbol) {
        // Check all 4 directions: horizontal, vertical, diagonal1, diagonal2
        int[][] directions = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};
        
        for (int[] dir : directions) {
            List<int[]> line = new ArrayList<>();
            line.add(new int[]{row, col});
            
            // Check positive direction
            int count = 1;
            int r = row + dir[0];
            int c = col + dir[1];
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && symbol.equals(board[r][c])) {
                line.add(new int[]{r, c});
                count++;
                r += dir[0];
                c += dir[1];
            }
            
            // Check negative direction
            r = row - dir[0];
            c = col - dir[1];
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && symbol.equals(board[r][c])) {
                line.add(0, new int[]{r, c}); // Add to beginning to maintain order
                count++;
                r -= dir[0];
                c -= dir[1];
            }
            
            if (count >= 5) {
                this.winningLine = line;
                return true;
            }
        }
        
        return false;
    }
    
    private boolean isBoardFull() {
        for (int i = 0; i < BOARD_SIZE; i++) {
            for (int j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] == null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Getters and Setters
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public GamePlayer getPlayer1() {
        return player1;
    }
    
    public void setPlayer1(GamePlayer player1) {
        this.player1 = player1;
    }
    
    public GamePlayer getPlayer2() {
        return player2;
    }
    
    public void setPlayer2(GamePlayer player2) {
        this.player2 = player2;
    }
    
    public String[][] getBoard() {
        return board;
    }
    
    public void setBoard(String[][] board) {
        this.board = board;
    }
    
    public String getCurrentPlayer() {
        return currentPlayer;
    }
    
    public void setCurrentPlayer(String currentPlayer) {
        this.currentPlayer = currentPlayer;
    }
    
    public GameStatus getStatus() {
        return status;
    }
    
    public void setStatus(GameStatus status) {
        this.status = status;
    }
    
    public String getWinner() {
        return winner;
    }
    
    public void setWinner(String winner) {
        this.winner = winner;
    }
    
    public List<int[]> getWinningLine() {
        return winningLine;
    }
    
    public void setWinningLine(List<int[]> winningLine) {
        this.winningLine = winningLine;
    }
    
    // Helper method to get player by symbol
    public GamePlayer getPlayerBySymbol(String symbol) {
        if ("X".equals(symbol)) {
            return player1;
        } else if ("O".equals(symbol)) {
            return player2;
        }
        return null;
    }
    
    // Helper method to get symbol by player ID
    public String getSymbolByPlayerId(Long playerId) {
        if (player1 != null && player1.getId().equals(playerId)) {
            return "X";
        } else if (player2 != null && player2.getId().equals(playerId)) {
            return "O";
        }
        return null;
    }
}