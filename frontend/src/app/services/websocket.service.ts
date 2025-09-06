import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface OnlineUser {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
  lastSeen: Date;
  hasUnreadMessages?: boolean;
}

export interface ChatMessage {
  id?: number;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private currentUserId: number | null = null;

  private onlineUsersSubject = new BehaviorSubject<OnlineUser[]>([]);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private gameMessagesSubject = new BehaviorSubject<any>(null);

  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public gameMessages$ = this.gameMessagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(userId: number): void {
    this.currentUserId = userId;
    console.log('Connecting WebSocket for user:', userId);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Get WebSocket URL - use current domain with /ws proxy
      const getWsUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // includes port if any
        return `${protocol}//${host}`;
      };
      
      const wsUrl = `${getWsUrl()}/ws?userId=${userId}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully!');
        console.log('WebSocket URL:', wsUrl);
        console.log('WebSocket readyState:', this.socket?.readyState);
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
        this.sendMessage({
          type: 'join',
          userId: userId
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected!', event.code, event.reason);
        console.log('WebSocket URL was:', wsUrl);
        console.log('Connection was forced to simulation mode');
        this.connectionStatusSubject.next(false);
        
        // Fallback to simulation mode
        console.log('Falling back to simulation mode');
        this.simulateConnection();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next(false);
        
        // Fallback to simulation mode on error
        console.log('WebSocket failed, using simulation mode');
        setTimeout(() => this.simulateConnection(), 1000);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      console.log('Falling back to simulated connection for development');
      // Simulate connection for development
      this.simulateConnection();
    }
  }

  private simulateConnection(): void {
    console.log('=== SIMULATION MODE ACTIVATED ===');
    console.log('WebSocket connection failed, using fallback simulation');
    // Just mark as connected, no mock users
    setTimeout(() => {
      console.log('Simulation mode: marking as connected');
      this.connectionStatusSubject.next(true);
      // Don't add mock users - wait for real WebSocket data
      this.onlineUsersSubject.next([]);
    }, 1000);
  }

  private handleMessage(data: any): void {
    console.log('WebSocket message received:', data);
    switch (data.type) {
      case 'online_users':
        console.log('Online users updated:', data.users);
        this.onlineUsersSubject.next(data.users);
        break;
      case 'user_joined':
        const currentUsers = this.onlineUsersSubject.value;
        if (!currentUsers.find(u => u.id === data.user.id)) {
          this.onlineUsersSubject.next([...currentUsers, data.user]);
        }
        break;
      case 'user_left':
        const updatedUsers = this.onlineUsersSubject.value.filter(u => u.id !== data.userId);
        this.onlineUsersSubject.next(updatedUsers);
        break;
      case 'chat_message':
        console.log('Chat message received:', data.message);
        const currentMessages = this.messagesSubject.value;
        const newMessages = [...currentMessages, data.message];
        console.log('Updating messages from', currentMessages.length, 'to', newMessages.length);
        this.messagesSubject.next(newMessages);
        
        // Mark sender as having unread messages
        this.markUserAsHavingUnreadMessages(data.message.senderId);
        break;
      case 'game_invitation':
      case 'game_start':
      case 'game_move':
      case 'game_end':
      case 'play_again_request':
        // Forward game messages to any subscribed game services
        this.handleGameMessage(data);
        break;
    }
  }

  sendChatMessage(receiverId: number, message: string): void {
    console.log('Sending chat message to', receiverId, ':', message);
    console.log('WebSocket state:', this.socket?.readyState);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('Sending via WebSocket');
      this.sendMessage({
        type: 'chat_message',
        receiverId: receiverId,
        message: message
      });
    } else {
      console.warn('WebSocket not connected, using simulation mode');
      // Simulate message sending for development
      this.simulateMessageSend(receiverId, message);
    }
  }

  private simulateMessageSend(receiverId: number, message: string): void {
    console.log('Simulating message send to', receiverId);
    
    // Only add the sent message, no mock response
    const mockMessage: ChatMessage = {
      id: Date.now(),
      senderId: this.currentUserId || 0,
      receiverId: receiverId,
      message: message,
      timestamp: new Date(),
      read: false
    };
    
    const currentMessages = this.messagesSubject.value;
    const newMessages = [...currentMessages, mockMessage];
    console.log('Simulated messages from', currentMessages.length, 'to', newMessages.length);
    this.messagesSubject.next(newMessages);
    
    // Don't simulate fake responses - wait for real users
  }

  sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(userId);
      }, this.reconnectInterval);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStatusSubject.next(false);
    this.onlineUsersSubject.next([]);
  }

  getMessagesForUser(userId: number): Observable<ChatMessage[]> {
    return new Observable(observer => {
      this.messages$.subscribe(messages => {
        const userMessages = messages.filter(m => 
          (m.senderId === userId) || (m.receiverId === userId)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        observer.next(userMessages);
      });
    });
  }

  loadHistoricalMessages(userId: number): void {
    if (!this.currentUserId) return;
    
    const url = `/api/chat/messages/${this.currentUserId}/${userId}`;
    console.log('Loading historical messages from:', url);
    
    this.http.get<ChatMessage[]>(url).subscribe({
      next: (historicalMessages: ChatMessage[]) => {
        console.log('Loaded historical messages from backend:', historicalMessages.length);
        
        const currentMessages = this.messagesSubject.value;
        const existingMessageIds = new Set(currentMessages.map(m => m.id));
        
        const newMessages = historicalMessages.filter((msg: ChatMessage) => !existingMessageIds.has(msg.id));
        
        if (newMessages.length > 0) {
          const allMessages = [...currentMessages, ...newMessages]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          console.log('Adding historical messages to chat:', newMessages.length);
          this.messagesSubject.next(allMessages);
        }
      },
      error: (error: any) => {
        console.error('Failed to load historical messages:', error);
      }
    });
  }

  markMessagesAsRead(userId: number): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.map(message => {
      if (message.senderId === userId && !message.read) {
        return { ...message, read: true };
      }
      return message;
    });
    this.messagesSubject.next(updatedMessages);
  }

  markUserAsHavingUnreadMessages(userId: number): void {
    // Only mark as unread if it's not the current user sending the message
    if (userId === this.currentUserId) {
      return;
    }
    
    const currentUsers = this.onlineUsersSubject.value;
    const updatedUsers = currentUsers.map(user => {
      if (user.id === userId) {
        return { ...user, hasUnreadMessages: true };
      }
      return user;
    });
    this.onlineUsersSubject.next(updatedUsers);
  }

  clearUnreadMessages(userId: number): void {
    const currentUsers = this.onlineUsersSubject.value;
    const updatedUsers = currentUsers.map(user => {
      if (user.id === userId) {
        return { ...user, hasUnreadMessages: false };
      }
      return user;
    });
    this.onlineUsersSubject.next(updatedUsers);
  }

  private handleGameMessage(data: any): void {
    console.log('Game message received:', data);
    this.gameMessagesSubject.next(data);
  }
}