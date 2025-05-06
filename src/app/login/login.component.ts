import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-container">
          <img src="/assets/toro-logo.png" alt="Toro AI Assistant" class="logo" onerror="this.src='https://toroinvestimentos.com.br/toro-radar/toro-logo.svg'; this.onerror=null;">
        </div>
        <h2>Toro AI Assistant</h2>
        <p class="subtitle">Seu assistente de investimentos inteligente</p>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Nome de Usuário</label>
            <input type="text" 
                  id="username" 
                  [(ngModel)]="username" 
                  name="username" 
                  required 
                  placeholder="Digite seu nome">
          </div>
          <button type="submit" [disabled]="!username" class="btn-login">Entrar</button>
        </form>
        
        <div class="footer">
          <p>Uma solução da Toro Investimentos</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: var(--toro-light);
    }
    
    .login-card {
      max-width: 400px;
      width: 90%;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 30px;
      text-align: center;
    }
    
    .logo-container {
      margin-bottom: 20px;
    }
    
    .logo {
      height: 50px;
    }
    
    h2 {
      color: var(--toro-dark);
      margin-bottom: 5px;
    }
    
    .subtitle {
      color: var(--toro-gray);
      margin-bottom: 25px;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--toro-dark);
      font-size: 14px;
    }
    
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--toro-border);
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    input:focus {
      outline: none;
      border-color: var(--toro-red);
    }
    
    .btn-login {
      background-color: var(--toro-red);
      color: white;
      border: none;
      padding: 12px 0;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    
    .btn-login:hover {
      background-color: #c8161c;
    }
    
    .btn-login:disabled {
      background-color: var(--toro-gray);
      cursor: not-allowed;
    }
    
    .footer {
      margin-top: 25px;
      font-size: 12px;
      color: var(--toro-gray);
    }
  `]
})
export class LoginComponent {
  username = '';
  
  constructor(private authService: AuthService) {}
  
  onSubmit(): void {
    if (this.username.trim()) {
      this.authService.login(this.username);
    }
  }
}
