import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent {
  logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
}
