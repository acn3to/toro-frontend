import { Injectable } from '@angular/core';
import { User } from './models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string): User {
    const userId = 'user_' + Math.floor(Math.random() * 10000);
    const user: User = { id: userId };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    
    return user;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    
    this.currentUserSubject.next(null);
  }
}
