import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OnlineUser {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
  lastSeen: Date;
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

  private onlineUsersSubject = new BehaviorSubject<OnlineUser[]>([]);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {}

  connect(userId: number): void {
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
        console.log('WebSocket connected');
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
        console.log('WebSocket disconnected', event.code, event.reason);
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
    // Just mark as connected, no mock users
    setTimeout(() => {
      this.connectionStatusSubject.next(true);
      // Don't add mock users - wait for real WebSocket data
      this.onlineUsersSubject.next([]);
    }, 1000);
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'online_users':
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
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, data.message]);
        break;
    }
  }

  sendChatMessage(receiverId: number, message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'chat_message',
        receiverId: receiverId,
        message: message
      });
    } else {
      console.warn('WebSocket not connected, cannot send message');
      // Simulate message sending for development
      this.simulateMessageSend(receiverId, message);
    }
  }

  private simulateMessageSend(receiverId: number, message: string): void {
    // Only add the sent message, no mock response
    const mockMessage: ChatMessage = {
      id: Date.now(),
      senderId: 1, // Current user ID  
      receiverId: receiverId,
      message: message,
      timestamp: new Date(),
      read: false
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, mockMessage]);
    
    // Don't simulate fake responses - wait for real users
  }

  private sendMessage(message: any): void {
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
}