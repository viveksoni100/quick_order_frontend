import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { API_DOMAIN } from '../constants';

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

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    this.errorMessage = '';
    const payload = {
      username: this.username.trim(),
      password: this.password.trim()
    };

    this.http.post<any>(`${API_DOMAIN}api/auth/login`, payload)
      .subscribe({
        next: (response) => {
          console.log('Token:', response.token);
          console.log('Role:', response.role);
          console.log('MenuId:', response.menuId);
          console.log('OutletId:', response.outletId);
          localStorage.setItem('token', response.token);
          localStorage.setItem('menuId', response.menuId);
          localStorage.setItem('outletId', response.outletId);
          // Redirect based on role
          if (response.role === 'ADMIN') {
            this.router.navigateByUrl('/admin-panel');
          } else if (response.role === 'USER') {
            this.router.navigateByUrl('/user-panel');
          } else {
            this.errorMessage = 'Unknown user role.';
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
  }
}
