import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './user-panel.component.html',
  styleUrl: './user-panel.component.css'
})
export class UserPanelComponent {
logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
}
