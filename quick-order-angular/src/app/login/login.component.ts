import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  onLogin() {
    this.errorMessage = '';
    const payload = {
    username: this.username.trim(),
    password: this.password.trim()
    };

    this.http.post<any>('http://localhost:9090/api/auth/login', payload)
      .subscribe({
        next: (response) => {
          console.log('Token:', response.token);
          localStorage.setItem('token', response.token);
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
  }
}
