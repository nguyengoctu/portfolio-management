import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService, GameInvitation } from '../../services/game.service';

@Component({
  selector: 'app-game-invitation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-invitation.component.html',
  styleUrl: './game-invitation.component.css'
})
export class GameInvitationComponent implements OnInit, OnDestroy {
  gameInvitations: GameInvitation[] = [];
  private invitationsSubscription?: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.invitationsSubscription = this.gameService.gameInvitations$.subscribe(invitations => {
      this.gameInvitations = invitations;
    });
  }

  ngOnDestroy() {
    if (this.invitationsSubscription) {
      this.invitationsSubscription.unsubscribe();
    }
  }

  acceptInvitation(gameId: string) {
    this.gameService.acceptGameInvitation(gameId);
  }

  declineInvitation(gameId: string) {
    this.gameService.declineGameInvitation(gameId);
  }

  closeInvitation(gameId: string) {
    this.gameService.removeInvitation(gameId);
  }
}