import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { API_DOMAIN } from '../constants';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, FormsModule],
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent {
  activeTab: string = 'dashboard';
  items: any[] = [];
  categories: any[] = [];
  showAddForm = false;
  newItem: any = {
    categoryId: '',
    name: '',
    description: '',
    price: '',
    ingredients: '',
    weight: '',
    image: '',
    isVeg: true,
    isActive: true
  };
  successMessage: string = '';

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

  fetchCategories() {
    const menuId = localStorage.getItem('menuId');
    const token = localStorage.getItem('token');
    if (!menuId || !token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>(`${API_DOMAIN}api/category/getAllByMenuId/${menuId}`, { headers })
      .subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error('Failed to fetch categories', err)
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

  onAddItem() {
    this.showAddForm = true;
    this.newItem = {
      categoryId: '',
      name: '',
      description: '',
      price: '',
      ingredients: '',
      weight: '',
      image: '',
      isVeg: true,
      isActive: true
    };
    this.fetchCategories();
  }

  submitNewItem() {
    const menuId = localStorage.getItem('menuId');
    const token = localStorage.getItem('token');
    if (!menuId || !token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      ...this.newItem,
      menuId: Number(menuId),
      price: Number(this.newItem.price),
      categoryId: Number(this.newItem.categoryId),
      isVeg: !!this.newItem.isVeg,
      isActive: !!this.newItem.isActive
    };

    this.http.post(`${API_DOMAIN}api/item/add`, payload, { headers, responseType: 'text' }).subscribe({
      next: (msg: string) => {
        this.successMessage = msg; // Show success message
        this.fetchItems();         // Reload items
        setTimeout(() => this.successMessage = '', 3000); // Hide after 3s (optional)
      },
      error: err => {
        alert('Failed to add item');
        console.error(err);
      }
    });
  }

  cancelAddItem() {
    this.showAddForm = false;
  }

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // You need to upload this file to your server or storage
      // After upload, set this.newItem.image = uploadedImageUrl;
      // For now, you can use a FileReader to preview or handle the file
      // Example for preview:
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // e.target.result is a base64 string (for preview only)
        // You still need to upload the file to get a URL for your API
      };
      reader.readAsDataURL(file);
    }
  }
}
