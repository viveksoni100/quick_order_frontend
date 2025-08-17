import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { API_DOMAIN } from '../constants';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent {
  activeTab: string = 'dashboard';
  items: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.activeTab === 'items') {
      this.fetchItems();
    }
  }

  fetchItems() {
    const menuId = localStorage.getItem('menuId');
    const token = localStorage.getItem('token');
    if (!menuId || !token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>(`${API_DOMAIN}api/item/getAllByMenuId/${menuId}`, { headers })
      .subscribe({
        next: (data) => this.items = data,
        error: (err) => console.error('Failed to fetch items', err)
      });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'items') {
      this.fetchItems();
    }
  }

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
  }

  // Add CRUD methods here (add, edit, delete)
  onAddItem() {
    throw new Error('Method not implemented.');
  }
}
