import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  onLogin() {
    console.log('Username:', this.username);
    console.log('Password:', this.password);
    // TODO: Call API for authentication
  }
}
