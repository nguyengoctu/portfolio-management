import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService, GameState } from '../../services/game.service';
import { AuthService } from '../../auth/auth.service';
import { GameBoardComponent } from '../game-board/game-board.component';

@Component({
  selector: 'app-game-window',
  standalone: true,
  imports: [CommonModule, GameBoardComponent],
  templateUrl: './game-window.component.html',
  styleUrl: './game-window.component.css'
})
export class GameWindowComponent implements OnInit, OnDestroy {
  currentGame: GameState | null = null;
  currentUserId: number = 0;
  playAgainRequested: boolean = false;
  private gameSubscription?: Subscription;
  private playAgainSubscription?: Subscription;

  constructor(
    private gameService: GameService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId() || 0;
    
    this.gameSubscription = this.gameService.currentGame$.subscribe(game => {
      this.currentGame = game;
      if (game?.status === 'playing' || game?.status === 'PLAYING') {
        this.playAgainRequested = false;
      }
    });

    this.playAgainSubscription = this.gameService.playAgainRequests$.subscribe(request => {
      if (request && request.requesterUserId !== this.currentUserId) {
        // Opponent requested play again
        if (confirm('Your opponent wants to play again. Do you want to continue?')) {
          this.gameService.sendPlayAgainRequest(); // Accept the request
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.gameSubscription) {
      this.gameSubscription.unsubscribe();
    }
    if (this.playAgainSubscription) {
      this.playAgainSubscription.unsubscribe();
    }
  }

  onCellClick(event: { row: number, col: number }) {
    if (this.currentGame && this.canMakeMove()) {
      this.gameService.makeMove(event.row, event.col);
    }
  }

  canMakeMove(): boolean {
    return this.gameService.canMakeMove(this.currentUserId);
  }

  quitGame() {
    if (confirm('Are you sure you want to quit the game?')) {
      this.gameService.quitGame();
    }
  }

  getCurrentPlayerName(): string {
    if (!this.currentGame) return '';
    
    const currentSymbol = this.currentGame.currentPlayer;
    if (currentSymbol === 'X') {
      return this.currentGame.players.player1.name;
    } else {
      return this.currentGame.players.player2.name;
    }
  }

  getPlayerSymbol(userId: number): string {
    if (!this.currentGame) return '';
    
    if (this.currentGame.players.player1.id === userId) {
      return 'X';
    } else if (this.currentGame.players.player2.id === userId) {
      return 'O';
    }
    return '';
  }

  getGameStatusMessage(): string {
    if (!this.currentGame) return '';

    if (this.currentGame.status === 'finished' || this.currentGame.status === 'FINISHED') {
      if (this.currentGame.winner) {
        const winnerName = this.currentGame.winner === 'X' ? 
          this.currentGame.players.player1.name : 
          this.currentGame.players.player2.name;
        return `🎉 ${winnerName} wins!`;
      } else {
        return "It's a draw!";
      }
    } else if (this.currentGame.status === 'playing') {
      const isMyTurn = this.canMakeMove();
      return isMyTurn ? "Your turn!" : `${this.getCurrentPlayerName()}'s turn`;
    }
    
    return '';
  }

  isGameFinished(): boolean {
    return this.currentGame?.status === 'finished' || this.currentGame?.status === 'FINISHED' || false;
  }

  playAgain() {
    this.playAgainRequested = true;
    this.gameService.sendPlayAgainRequest();
  }

  closeGame() {
    this.gameService.quitGame();
  }
}