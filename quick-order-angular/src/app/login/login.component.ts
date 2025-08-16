import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private http: HttpClient) {}

  onLogin() {
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
          // Handle error (show message to user, etc.)
        }
      });
  }
}
