import { Component, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { QuestionsService } from '../questions.service';
import { Message } from '../models/message.model';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatMessage',
  standalone: true
})
export class FormatMessagePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';
    
    let formattedText = text.replace(/%\[\d+\]%/g, '');
    
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    formattedText = formattedText.replace(/(\d+\.)\s+([^\n]+)/g, '<span class="list-item">$1 $2</span>');
    
    formattedText = formattedText.replace(/[•\-]\s+([^\n]+)/g, '<span class="list-item">• $1</span>');
    
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formattedText);
  }
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, FormatMessagePipe],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <div class="header-left">
          <img src="/assets/toro-logo.png" alt="Toro AI Assistant" class="logo" onerror="this.src='https://toroinvestimentos.com.br/toro-radar/toro-logo.svg'; this.onerror=null;">
          <h2>Toro AI Assistant</h2>
        </div>
        <div class="header-right">
          <div class="connection-status" [class.online]="isConnected" [class.offline]="!isConnected">
            {{ isConnected ? 'Conectado' : 'Desconectado' }}
          </div>
          <div class="header-actions">
            <button class="btn-action" (click)="clearChat()" title="Limpar histórico">
              <span class="action-text">Limpar</span>
            </button>
            <button class="btn-action btn-logout" (click)="logout()">
              <span class="action-text">Sair</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="chat-messages" #chatMessages>
        <div *ngFor="let message of messages" 
             class="message" 
             [class.user-message]="message.isUser" 
             [class.ai-message]="!message.isUser">
          <div *ngIf="message.isUser">{{ message.text }}</div>
          <div *ngIf="!message.isUser" [innerHTML]="message.text | formatMessage"></div>
        </div>
      </div>
      
      <form class="message-form" (ngSubmit)="sendQuestion()">
        <input type="text" 
               [(ngModel)]="questionText" 
               name="question" 
               placeholder="Digite sua pergunta sobre investimentos..." 
               required>
        <button type="submit" [disabled]="!questionText.trim()" class="btn-send">
          <span>Enviar</span>
        </button>
      </form>
      
      <div class="footer">
        <p>© Toro Investimentos {{ currentYear }} - Todos os direitos reservados</p>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--toro-light);
    }
    
    .chat-header {
      padding: 15px 20px;
      background-color: white;
      border-bottom: 1px solid var(--toro-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .header-left {
      display: flex;
      align-items: center;
    }
    
    .logo {
      height: 28px;
      margin-right: 12px;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    h2 {
      font-size: 18px;
      margin: 0;
      color: var(--toro-dark);
    }
    
    .connection-status {
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .online {
      background-color: #d4edda;
      color: #155724;
    }
    
    .offline {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
    
    .btn-action {
      color: var(--toro-dark);
      background-color: transparent;
      border: 1px solid var(--toro-border);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .btn-action:hover {
      background-color: var(--toro-light-gray);
    }
    
    .btn-logout {
      color: white;
      background-color: var(--toro-red);
      border: none;
    }
    
    .btn-logout:hover {
      background-color: #c8161c;
    }
    
    .action-text {
      font-weight: 500;
    }
    
    .chat-messages {
      flex-grow: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 15px;
      background-color: #f9f9fa;
    }
    
    .message {
      padding: 12px 15px;
      border-radius: 15px;
      max-width: 70%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .user-message {
      background-color: #e3f2fd;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
      color: #0d47a1;
    }
    
    .ai-message {
      background-color: white;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
      color: var(--toro-dark);
      border-left: 3px solid var(--toro-red);
    }
    
    .list-item {
      display: block;
      margin: 4px 0;
    }
    
    .message-form {
      display: flex;
      padding: 15px 20px;
      background-color: white;
      border-top: 1px solid var(--toro-border);
    }
    
    input {
      flex-grow: 1;
      padding: 12px 15px;
      border: 1px solid var(--toro-border);
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    input:focus {
      outline: none;
      border-color: var(--toro-red);
      box-shadow: 0 0 0 3px rgba(227, 30, 36, 0.1);
    }
    
    .btn-send {
      background-color: var(--toro-red);
      color: white;
      border: none;
      padding: 0 20px;
      margin-left: 10px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .btn-send:hover {
      background-color: #c8161c;
    }
    
    .btn-send:disabled {
      background-color: var(--toro-gray);
      cursor: not-allowed;
    }
    
    .footer {
      padding: 10px;
      text-align: center;
      font-size: 12px;
      color: var(--toro-gray);
      border-top: 1px solid var(--toro-border);
      background-color: white;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  questionText = '';
  isConnected = false;
  currentYear = new Date().getFullYear();
  
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
          const isDuplicate = this.messages.some(
            m => m.text === message.text && m.isUser === message.isUser
          );
          
          if (!isDuplicate) {
            this.messages.push(message);
          }
          
          setTimeout(() => this.scrollToBottom(), 100);
        })
      );
      
      this.subscriptions.push(
        this.questionsService.connectionStatus$.subscribe(status => {
          this.isConnected = status;
        })
      );
      
      this.questionsService.connectWebSocket(this.userId);
      
      if (this.messages.length === 0) {
        this.addWelcomeMessage();
      }
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
  
  clearChat(): void {
    if (confirm('Deseja limpar o histórico de conversas? Esta ação não pode ser desfeita.')) {
      this.questionsService.clearMessages(this.userId);
      this.messages = [];
      this.addWelcomeMessage();
    }
  }
  
  private addWelcomeMessage(): void {
    const welcomeMessage: Message = {
      text: 'Olá! Sou o assistente virtual da Toro Investimentos. Estou aqui para ajudar com suas dúvidas sobre investimentos, ações, fundos e muito mais. Como posso te ajudar hoje?',
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
    
    this.questionsService.saveMessage(this.userId, welcomeMessage);
  }
  
  private scrollToBottom(): void {
    const element = document.querySelector('.chat-messages');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
