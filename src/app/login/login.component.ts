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
      <h2>Toro AI Assistant</h2>
      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Nome de Usuário</label>
          <input type="text" id="username" [(ngModel)]="username" name="username" required placeholder="Digite seu nome">
        </div>
        <button type="submit" [disabled]="!username">Entrar</button>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 100px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 4px;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-top: 5px;
    }
    
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
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
