import { Component, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { QuestionsService, MessageStatus } from '../questions.service';
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
    
    // Se o texto já contém tags HTML, apenas remover referências %[n]%
    if (text.includes('<span') || text.includes('<br>') || text.includes('<strong>')) {
      let formattedText = text.replace(/%\[\d+\]%/g, '');
      return this.sanitizer.bypassSecurityTrustHtml(formattedText);
    }
    
    // Processamento normal para texto sem HTML
    // Remover as referências no formato %[n]%
    let formattedText = text.replace(/%\[\d+\]%/g, '');
    
    // Substituir quebras de linha por <br>
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Converter marcadores de lista (1., 2., etc) para elementos HTML
    formattedText = formattedText.replace(/(\d+\.)\s+([^\n]+)/g, '<span class="list-item">$1 $2</span>');
    
    // Converter marcadores de lista não numerada
    formattedText = formattedText.replace(/[•\-]\s+([^\n]+)/g, '<span class="list-item">• $1</span>');
    
    // Converter texto em negrito (**texto**)
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
            <button class="btn-action" (click)="openConfirmModal()" title="Limpar histórico">
              <span class="action-text">Limpar</span>
            </button>
            <button class="btn-action btn-logout" (click)="logout()">
              <span class="action-text">Sair</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="chat-messages" #chatMessages>
        <div *ngFor="let message of messages; let i = index" 
             class="message" 
             [class.user-message]="message.isUser" 
             [class.ai-message]="!message.isUser"
             [class.welcome-message]="i === 0 && !message.isUser">
          <div *ngIf="message.isUser">{{ message.text }}</div>
          <div *ngIf="!message.isUser" [innerHTML]="message.text | formatMessage" [class.typing-effect]="i !== 0 || !welcomeMessageRendered"></div>
        </div>
        
        <!-- Skeleton Loader -->
        <div *ngIf="messageStatus === 'pending'" class="message ai-message skeleton-container">
          <div class="skeleton-header"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 80%"></div>
          <div class="skeleton-line" style="width: 60%"></div>
        </div>
      </div>
      
      <form class="message-form" (ngSubmit)="sendQuestion()">
        <input type="text" 
               [(ngModel)]="questionText" 
               name="question" 
               placeholder="Digite sua pergunta sobre investimentos..." 
               required
               [disabled]="messageStatus === 'pending'">
        <button type="submit" 
                [disabled]="!questionText.trim() || messageStatus === 'pending'" 
                class="btn-send">
          <span>Enviar</span>
        </button>
      </form>
      
      <div class="footer">
        <p>© Toro Investimentos {{ currentYear }} - Todos os direitos reservados</p>
      </div>
    </div>
    
    <!-- Modal de confirmação -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirmar ação</h3>
          <button class="modal-close" (click)="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <p>Deseja realmente limpar todo o histórico de conversas?</p>
          <p class="modal-warning">Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal btn-cancel" (click)="closeModal()">Cancelar</button>
          <button class="btn-modal btn-confirm" (click)="confirmClearChat()">Confirmar</button>
        </div>
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
    
    /* Efeito de digitação */
    .typing-effect {
      overflow: hidden;
      animation: typing 0.05s steps(1, end);
    }
    
    /* Skeleton loader */
    .skeleton-container {
      padding: 15px;
      background-color: white;
      border-radius: 15px;
      border-left: 3px solid var(--toro-red);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      max-width: 70%;
    }
    
    .skeleton-header {
      height: 15px;
      width: 60%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .skeleton-line {
      height: 12px;
      width: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
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
    
    /* Estilos para o Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }
    
    .modal-container {
      background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--toro-border);
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--toro-dark);
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--toro-gray);
      line-height: 1;
      padding: 0;
      margin: 0;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-warning {
      color: var(--toro-red);
      font-size: 14px;
      margin-top: 10px;
      font-weight: 500;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--toro-border);
    }
    
    .btn-modal {
      padding: 8px 20px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-cancel {
      background-color: white;
      color: var(--toro-dark);
      border: 1px solid var(--toro-border);
    }
    
    .btn-cancel:hover {
      background-color: var(--toro-light-gray);
    }
    
    .btn-confirm {
      background-color: var(--toro-red);
      color: white;
      border: none;
    }
    
    .btn-confirm:hover {
      background-color: #c8161c;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  questionText = '';
  isConnected = false;
  currentYear = new Date().getFullYear();
  messageStatus = MessageStatus.IDLE;
  showModal = false;
  welcomeMessageRendered = false;
  
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
            
            if (!message.isUser) {
              if (this.messages.length > 1 || !this.welcomeMessageRendered) {
                this.applyTypingEffect(message);
              }
            }
          }
          
          setTimeout(() => this.scrollToBottom(), 100);
        })
      );
      
      this.subscriptions.push(
        this.questionsService.connectionStatus$.subscribe(status => {
          this.isConnected = status;
        })
      );
      
      this.subscriptions.push(
        this.questionsService.messageStatus$.subscribe(status => {
          this.messageStatus = status;
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
    if (this.questionText.trim() && this.userId && this.messageStatus !== MessageStatus.PENDING) {
      this.questionsService.sendQuestion(this.userId, this.questionText);
      this.questionText = '';
    }
  }
  
  logout(): void {
    this.questionsService.disconnectWebSocket();
    this.authService.logout();
  }
  
  openConfirmModal(): void {
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeModal(): void {
    this.showModal = false;
    document.body.style.overflow = '';
  }
  
  confirmClearChat(): void {
    this.questionsService.clearMessages(this.userId);
    this.messages = [];
    this.addWelcomeMessage();
    this.closeModal();
  }
  
  private addWelcomeMessage(): void {
    const welcomeMessage: Message = {
      text: 'Olá! Sou o assistente virtual da Toro Investimentos. Estou aqui para ajudar com suas dúvidas sobre investimentos, ações, fundos e muito mais. Como posso te ajudar hoje?',
      isUser: false,
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
    
    this.questionsService.saveMessage(this.userId, welcomeMessage);
    
    // Marcar a mensagem de boas-vindas como renderizada após um breve momento
    setTimeout(() => {
      this.welcomeMessageRendered = true;
    }, 200);
  }
  
  private applyTypingEffect(message: Message): void {
    // Buscar o elemento da mensagem mais recente
    setTimeout(() => {
      const messageElements = document.querySelectorAll('.typing-effect');
      if (messageElements.length > 0) {
        const lastMessageElement = messageElements[messageElements.length - 1] as HTMLElement;
        
        // Armazenar o texto completo
        const fullText = lastMessageElement.innerHTML;
        
        // Para textos muito longos (com mais de 500 caracteres), não usar efeito de digitação
        if (fullText.length > 500) {
          // Para textos longos, apenas mostrar o texto completo após um breve delay
          setTimeout(() => {
            lastMessageElement.classList.remove('typing-effect');
          }, 1000);
          return;
        }
        
        // Limpar o elemento
        lastMessageElement.innerHTML = '';
        
        // Caractere por caractere
        let i = 0;
        // Ajusta a velocidade de acordo com o tamanho do texto
        let typeSpeed = 5; // Base speed (5ms por caractere)
        
        // Se o texto for mais longo, torna mais rápido ainda
        if (fullText.length > 300) typeSpeed = 3;
        if (fullText.length > 400) typeSpeed = 1;
        
        // Simulação de digitação
        const typeWriter = () => {
          if (i < fullText.length) {
            // Adiciona um caractere por vez
            lastMessageElement.innerHTML += fullText.charAt(i);
            i++;
            setTimeout(typeWriter, typeSpeed);
          } else {
            // Quando terminar de "digitar", remove a classe para esconder o cursor
            setTimeout(() => {
              lastMessageElement.classList.remove('typing-effect');
            }, 1000); // Mantém o cursor piscando por 1 segundo após terminar
          }
          this.scrollToBottom();
        };
        
        typeWriter();
      }
    }, 100);
  }
  
  private scrollToBottom(): void {
    const element = document.querySelector('.chat-messages');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
