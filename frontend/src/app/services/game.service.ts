import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketService } from './websocket.service';

export interface GameState {
  gameId: string;
  board: (string | null)[][];
  currentPlayer: string;
  players: {
    player1: { id: number; name: string; symbol: 'X' };
    player2: { id: number; name: string; symbol: 'O' };
  };
  status: 'waiting' | 'playing' | 'finished' | 'WAITING' | 'PLAYING' | 'FINISHED';
  winner: string | null;
  winningLine: number[][] | null;
  lastMove: { row: number; col: number } | null;
  scoreboard: {
    player1Wins: number;
    player2Wins: number;
    draws: number;
  };
}

export interface GameInvitation {
  gameId: string;
  fromUser: { id: number; name: string };
  toUser: { id: number; name: string };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private currentGameSubject = new BehaviorSubject<GameState | null>(null);
  private gameInvitationsSubject = new BehaviorSubject<GameInvitation[]>([]);
  private playAgainRequestsSubject = new BehaviorSubject<{requesterUserId: number, gameId: string} | null>(null);

  public currentGame$ = this.currentGameSubject.asObservable();
  public gameInvitations$ = this.gameInvitationsSubject.asObservable();
  public playAgainRequests$ = this.playAgainRequestsSubject.asObservable();

  constructor(private websocketService: WebSocketService) {
    this.setupGameListeners();
  }

  private setupGameListeners() {
    // Listen for game-related WebSocket messages
    this.websocketService.gameMessages$.subscribe(message => {
      if (!message) return;
      
      if (message.type === 'game_invitation') {
        this.handleGameInvitation(message.data);
      } else if (message.type === 'game_start') {
        this.handleGameStart(message.data);
      } else if (message.type === 'game_move') {
        this.handleGameMove(message.data);
      } else if (message.type === 'game_end') {
        this.handleGameEnd(message.data);
      } else if (message.type === 'play_again_request') {
        this.handlePlayAgainRequest(message.data);
      }
    });
  }

  // Send game invitation
  sendGameInvitation(toUserId: number) {
    this.websocketService.sendMessage({
      type: 'send_game_invitation',
      data: { toUserId }
    });
  }

  // Accept game invitation
  acceptGameInvitation(gameId: string) {
    this.websocketService.sendMessage({
      type: 'accept_game_invitation',
      data: { gameId }
    });
  }

  // Decline game invitation
  declineGameInvitation(gameId: string) {
    this.websocketService.sendMessage({
      type: 'decline_game_invitation',
      data: { gameId }
    });
  }

  // Make a move in the game
  makeMove(row: number, col: number) {
    const currentGame = this.currentGameSubject.value;
    if (!currentGame) return;

    this.websocketService.sendMessage({
      type: 'game_move',
      data: {
        gameId: currentGame.gameId,
        row,
        col
      }
    });
  }

  // Quit current game
  quitGame() {
    const currentGame = this.currentGameSubject.value;
    if (!currentGame) return;

    this.websocketService.sendMessage({
      type: 'quit_game',
      data: { gameId: currentGame.gameId }
    });

    this.currentGameSubject.next(null);
  }

  private handleGameInvitation(data: any) {
    const invitation: GameInvitation = {
      gameId: data.gameId,
      fromUser: data.fromUser,
      toUser: data.toUser,
      timestamp: new Date(data.timestamp)
    };

    const currentInvitations = this.gameInvitationsSubject.value;
    this.gameInvitationsSubject.next([...currentInvitations, invitation]);
  }

  private handleGameStart(data: any) {
    const gameState: GameState = {
      gameId: data.gameId,
      board: this.createEmptyBoard(),
      currentPlayer: data.currentPlayer,
      players: data.players,
      status: 'playing',
      winner: null,
      winningLine: null,
      lastMove: null,
      scoreboard: data.scoreboard || {
        player1Wins: 0,
        player2Wins: 0,
        draws: 0
      }
    };

    this.currentGameSubject.next(gameState);
    
    // Remove invitation from list if it exists
    const currentInvitations = this.gameInvitationsSubject.value;
    const updatedInvitations = currentInvitations.filter(inv => inv.gameId !== data.gameId);
    this.gameInvitationsSubject.next(updatedInvitations);
  }

  private handleGameMove(data: any) {
    console.log('Handling game move:', data);
    const currentGame = this.currentGameSubject.value;
    if (!currentGame) {
      console.log('No current game found');
      return;
    }

    const updatedGame: GameState = {
      ...currentGame,
      board: data.board,
      currentPlayer: data.currentPlayer,
      status: data.status,
      winner: data.winner,
      winningLine: data.winningLine,
      lastMove: data.lastMove || null,
      scoreboard: data.scoreboard || currentGame.scoreboard
    };

    console.log('Updated game state:', updatedGame);
    this.currentGameSubject.next(updatedGame);
  }

  private handleGameEnd(data: any) {
    const currentGame = this.currentGameSubject.value;
    if (!currentGame) return;

    const updatedGame: GameState = {
      ...currentGame,
      status: 'finished',
      winner: data.winner,
      winningLine: data.winningLine,
      scoreboard: data.scoreboard || currentGame.scoreboard
    };

    this.currentGameSubject.next(updatedGame);
  }

  private handlePlayAgainRequest(data: any) {
    this.playAgainRequestsSubject.next({
      requesterUserId: data.requesterUserId,
      gameId: data.gameId
    });
  }

  private createEmptyBoard(): (string | null)[][] {
    return Array(20).fill(null).map(() => Array(20).fill(null));
  }

  // Remove invitation from list
  removeInvitation(gameId: string) {
    const currentInvitations = this.gameInvitationsSubject.value;
    const updatedInvitations = currentInvitations.filter(inv => inv.gameId !== gameId);
    this.gameInvitationsSubject.next(updatedInvitations);
  }

  // Check if current user can make a move
  canMakeMove(userId: number): boolean {
    const game = this.currentGameSubject.value;
    console.log('CanMakeMove check - Game:', game, 'UserId:', userId);
    
    if (!game || (game.status !== 'playing' && game.status !== 'PLAYING')) {
      console.log('Cannot make move - no game or not playing. Status:', game?.status);
      return false;
    }

    const currentPlayerSymbol = game.currentPlayer;
    const currentPlayerId = currentPlayerSymbol === 'X' ? 
      game.players.player1.id : game.players.player2.id;

    console.log('Current player symbol:', currentPlayerSymbol, 'Current player ID:', currentPlayerId);
    const canMove = currentPlayerId === userId;
    console.log('Can make move:', canMove);
    return canMove;
  }

  // Get current game
  getCurrentGame(): GameState | null {
    return this.currentGameSubject.value;
  }

  // Send play again request
  sendPlayAgainRequest() {
    const currentGame = this.currentGameSubject.value;
    if (currentGame) {
      this.websocketService.sendMessage({
        type: 'play_again_request',
        data: {
          gameId: currentGame.gameId
        }
      });
    }
  }
}