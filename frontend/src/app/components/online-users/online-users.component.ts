import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService, OnlineUser } from '../../services/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-online-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './online-users.component.html',
  styleUrl: './online-users.component.css'
})
export class OnlineUsersComponent implements OnInit, OnDestroy {
  onlineUsers: OnlineUser[] = [];
  isConnected: boolean = false;
  showOnlineUsers: boolean = false;
  
  @Output() startChat = new EventEmitter<OnlineUser>();
  
  private subscriptions: Subscription[] = [];

  constructor(
    private websocketService: WebSocketService,
    private authService: AuthService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Subscribe to online users
    this.subscriptions.push(
      this.websocketService.onlineUsers$.subscribe(users => {
        const currentUser = this.authService.getCurrentUser();
        // Filter out current user from the list
        this.onlineUsers = users.filter(user => user.id !== currentUser?.id);
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.websocketService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );

    // Connect to WebSocket if user is logged in
    if (this.authService.isLoggedIn()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.id) {
        this.websocketService.connect(currentUser.id);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleOnlineUsers(): void {
    this.showOnlineUsers = !this.showOnlineUsers;
  }

  openChat(user: OnlineUser): void {
    this.startChat.emit(user);
  }

  getDefaultAvatar(): string {
    return '/assets/default-avatar.png';
  }

  getOnlineCount(): number {
    return this.onlineUsers.length;
  }

  getUnreadNotificationsCount(): number {
    return this.onlineUsers.filter(user => user.hasUnreadMessages).length;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.showOnlineUsers && !this.elementRef.nativeElement.contains(event.target)) {
      this.showOnlineUsers = false;
    }
  }
}