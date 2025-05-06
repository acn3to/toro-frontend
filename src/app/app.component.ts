import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, ChatComponent],
  template: `
    <div class="container">
      <app-login *ngIf="!currentUser"></app-login>
      <app-chat *ngIf="currentUser"></app-chat>
    </div>
  `,
  styles: [`
    .container {
      height: 100%;
      width: 100%;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private subscription: Subscription | null = null;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
