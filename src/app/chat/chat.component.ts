import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { QuestionsService } from '../questions.service';
import { Message } from '../models/message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>Toro AI Assistant</h2>
        <div class="connection-status" [class.online]="isConnected" [class.offline]="!isConnected">
          {{ isConnected ? 'Conectado' : 'Desconectado' }}
        </div>
        <button class="logout-button" (click)="logout()">Sair</button>
      </div>
      
      <div class="chat-messages" #chatMessages>
        <div *ngFor="let message of messages" 
             class="message" 
             [class.user-message]="message.isUser" 
             [class.ai-message]="!message.isUser">
          {{ message.text }}
        </div>
      </div>
      
      <form class="message-form" (ngSubmit)="sendQuestion()">
        <input type="text" 
               [(ngModel)]="questionText" 
               name="question" 
               placeholder="Digite sua pergunta sobre investimentos..." 
               required>
        <button type="submit" [disabled]="!questionText.trim()">Enviar</button>
      </form>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 800px;
      margin: 20px auto;
      border: 1px solid #ccc;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      height: 90vh;
    }
    
    .chat-header {
      padding: 10px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .connection-status {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .online {
      background-color: #d4edda;
      color: #155724;
    }
    
    .offline {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .logout-button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .chat-messages {
      flex-grow: 1;
      padding: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background-color: #f9f9f9;
    }
    
    .message {
      padding: 8px 12px;
      border-radius: 15px;
      max-width: 70%;
    }
    
    .user-message {
      background-color: #dcf8c6;
      align-self: flex-end;
    }
    
    .ai-message {
      background-color: #ffffff;
      align-self: flex-start;
      border: 1px solid #ddd;
    }
    
    .message-form {
      display: flex;
      padding: 10px;
      border-top: 1px solid #ccc;
    }
    
    input {
      flex-grow: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      margin-left: 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  questionText = '';
  isConnected = false;
  
  private userId = '';
  private subscriptions: Subscription[] = [];
  
  constructor(
    private authService: AuthService,
    private questionsService: QuestionsService
  ) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      this.userId = currentUser.id;
      
      this.subscriptions.push(
        this.questionsService.messages$.subscribe(message => {
          this.messages.push(message);

          setTimeout(() => this.scrollToBottom(), 100);
        })
      );
      
      this.subscriptions.push(
        this.questionsService.connectionStatus$.subscribe(status => {
          this.isConnected = status;
        })
      );
      
      this.questionsService.connectWebSocket(this.userId);
      
      this.addWelcomeMessage();
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.questionsService.disconnectWebSocket();
  }
  
  sendQuestion(): void {
    if (this.questionText.trim() && this.userId) {
      this.questionsService.sendQuestion(this.userId, this.questionText);
      this.questionText = '';
    }
  }
  
  logout(): void {
    this.questionsService.disconnectWebSocket();
    this.authService.logout();
  }
  
  private addWelcomeMessage(): void {
    const welcomeMessage: Message = {
      text: 'Olá! Sou o Toro AI Assistant. Como posso ajudar com suas dúvidas sobre investimentos?',
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
  }
  
  private scrollToBottom(): void {
    const element = document.querySelector('.chat-messages');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
