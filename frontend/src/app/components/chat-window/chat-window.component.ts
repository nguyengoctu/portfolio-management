import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService, OnlineUser, ChatMessage } from '../../services/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css'
})
export class ChatWindowComponent implements OnInit, OnDestroy, OnChanges {
  @Input() chatUser!: OnlineUser;
  @Input() isMinimized: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() minimize = new EventEmitter<void>();
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: number = 0;
  isTyping: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private websocketService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.currentUserId = currentUser.id;
    }

    this.loadMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatUser'] && this.chatUser) {
      this.loadMessages();
      this.markMessagesAsRead();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadMessages(): void {
    if (!this.chatUser) return;

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.subscriptions.push(
      this.websocketService.getMessagesForUser(this.chatUser.id).subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      })
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.chatUser) return;

    this.websocketService.sendChatMessage(this.chatUser.id, this.newMessage.trim());
    this.newMessage = '';
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  closeChat(): void {
    this.close.emit();
  }

  minimizeChat(): void {
    this.minimize.emit();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 50);
  }

  private markMessagesAsRead(): void {
    if (this.chatUser) {
      this.websocketService.markMessagesAsRead(this.chatUser.id);
    }
  }

  isMessageFromCurrentUser(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  formatMessageTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getDefaultAvatar(): string {
    return '/assets/default-avatar.png';
  }

  getUnreadCount(): number {
    return this.messages.filter(m => 
      m.senderId === this.chatUser.id && !m.read
    ).length;
  }
}