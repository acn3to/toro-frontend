import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Message } from './models/message.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<Message>();
  messages$ = this.messageSubject.asObservable();
  
  private connectionStatusSubject = new Subject<boolean>();
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private readonly API_ENDPOINT = 'https://ka8fa8gabl.execute-api.us-east-2.amazonaws.com/Prod/questions';
  private readonly WEBSOCKET_BASE = 'wss://48u9qfzbz5.execute-api.us-east-2.amazonaws.com/prod';
  
  constructor() { }
  
  connectWebSocket(userId: string): void {
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
            this.addMessage(data.answer, false);
          } else if (data.type === 'question_update' && data.status === 'error') {
            this.addMessage('Erro ao processar pergunta: ' + (data.error_message || 'Erro desconhecido'), false);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
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
        this.addMessage('Erro ao enviar pergunta: ' + data.error, false);
      } else {
        this.addMessage('Pergunta enviada! Aguardando resposta...', false);
      }
      
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      this.addMessage('Erro ao enviar pergunta', false);
    }
  }
  
  private addMessage(text: string, isUser: boolean): void {
    const message: Message = {
      text,
      isUser,
      timestamp: new Date()
    };
    
    this.messageSubject.next(message);
  }
}
