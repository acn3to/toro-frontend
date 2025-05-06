import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Message } from './models/message.model';

export enum MessageStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  COMPLETED = 'completed',
  ERROR = 'error'
}

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<Message>();
  messages$ = this.messageSubject.asObservable();
  
  private connectionStatusSubject = new Subject<boolean>();
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private messageStatusSubject = new BehaviorSubject<MessageStatus>(MessageStatus.IDLE);
  messageStatus$ = this.messageStatusSubject.asObservable();
  
  private readonly API_ENDPOINT = 'https://ka8fa8gabl.execute-api.us-east-2.amazonaws.com/Prod/questions';
  private readonly WEBSOCKET_BASE = 'wss://48u9qfzbz5.execute-api.us-east-2.amazonaws.com/prod';
  private readonly STORAGE_KEY_PREFIX = 'toro_messages_';
  
  private messagesCache: Map<string, Message[]> = new Map();
  private currentUserId: string = '';
  
  constructor() { }
  
  connectWebSocket(userId: string): void {
    this.currentUserId = userId;
    
    this.loadMessages(userId);
    
    const url = `${this.WEBSOCKET_BASE}?user_id=${userId}`;
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WebSocket conectado');
        this.connectionStatusSubject.next(true);
      };
      
      this.socket.onmessage = (event) => {
        console.log('Mensagem recebida:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'question_update' && data.status === 'completed') {
            this.messageStatusSubject.next(MessageStatus.COMPLETED);
            this.addMessage(data.answer, false);
          } else if (data.type === 'question_update' && data.status === 'error') {
            this.messageStatusSubject.next(MessageStatus.ERROR);
            this.addMessage('Erro ao processar pergunta: ' + (data.error_message || 'Erro desconhecido'), false);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
          this.messageStatusSubject.next(MessageStatus.ERROR);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket desconectado');
        this.connectionStatusSubject.next(false);
        
        setTimeout(() => this.connectWebSocket(userId), 3000);
      };
      
      this.socket.onerror = (error) => {
        console.error('Erro de WebSocket:', error);
        this.connectionStatusSubject.next(false);
      };
      
    } catch (error) {
      console.error('Erro ao conectar ao WebSocket:', error);
      this.connectionStatusSubject.next(false);
    }
  }
  
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  async sendQuestion(userId: string, question: string): Promise<void> {
    if (!question.trim()) return;
    
    try {
      this.addMessage(question, true);
      
      this.messageStatusSubject.next(MessageStatus.PENDING);
      
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          question: question
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Erro ao enviar pergunta:', data.error);
        this.messageStatusSubject.next(MessageStatus.ERROR);
        this.addMessage('Erro ao enviar pergunta: ' + data.error, false);
      }

      
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      this.messageStatusSubject.next(MessageStatus.ERROR);
      this.addMessage('Erro ao enviar pergunta', false);
    }
  }
  
  private addMessage(text: string, isUser: boolean): void {
    const message: Message = {
      text,
      isUser,
      timestamp: new Date()
    };
    
    this.saveMessage(this.currentUserId, message);
    
    this.messageSubject.next(message);
  }
  
  loadMessages(userId: string): Message[] {
    if (!userId) return [];
    
    if (this.messagesCache.has(userId)) {
      const messages = this.messagesCache.get(userId) || [];
      messages.forEach(msg => this.messageSubject.next(msg));
      return messages;
    }
    
    try {
      const storedMessages = localStorage.getItem(this.STORAGE_KEY_PREFIX + userId);
      if (storedMessages) {
        const messages: Message[] = JSON.parse(storedMessages);
        
        messages.forEach(msg => {
          if (typeof msg.timestamp === 'string') {
            msg.timestamp = new Date(msg.timestamp);
          }
        });
        
        this.messagesCache.set(userId, messages);
        
        messages.forEach(msg => this.messageSubject.next(msg));
        
        return messages;
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
    
    this.messagesCache.set(userId, []);
    return [];
  }
  
  saveMessage(userId: string, message: Message): void {
    if (!userId) return;
    
    try {
      const messages = this.messagesCache.get(userId) || [];
      
      messages.push(message);
      
      this.messagesCache.set(userId, messages);
      
      localStorage.setItem(this.STORAGE_KEY_PREFIX + userId, JSON.stringify(messages));
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  }
  
  clearMessages(userId: string): void {
    if (!userId) return;
    
    localStorage.removeItem(this.STORAGE_KEY_PREFIX + userId);
    this.messagesCache.delete(userId);
  }
}
