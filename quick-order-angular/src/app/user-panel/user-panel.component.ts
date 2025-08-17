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
  errorMessage: string = ''; 

  searchText: string = '';
  filteredItems: any[] = [];
  paginatedItems: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  showDeleteModal = false;
  itemIdToDelete: number | null = null;

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
        next: (data) => {
          this.items = data;
          this.applySearchAndPagination(); // Apply search and pagination after fetching items
        },
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

  onSearch() {
    this.currentPage = 1;
    this.applySearchAndPagination();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.applySearchAndPagination();
  }

  applySearchAndPagination() {
    // Filter
    const search = this.searchText?.trim().toLowerCase() || '';
    this.filteredItems = search
      ? this.items.filter(item =>
          item.name.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search)
        )
      : [...this.items];

    // Pagination
    this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.filteredItems.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }

  deleteItem(itemId: number) {
    if (confirm('Are you sure?')) {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.delete(`${API_DOMAIN}api/item/removeById/${itemId}`, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.errorMessage = msg; // Show API response in red alert
            this.fetchItems();       // Refresh items
            setTimeout(() => this.errorMessage = '', 3000); // Hide after 3s (optional)
          },
          error: err => {
            this.errorMessage = 'Failed to delete item';
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    }
  }

  openDeleteModal(itemId: number) {
  this.itemIdToDelete = itemId;
  this.showDeleteModal = true;
}

closeDeleteModal() {
  this.showDeleteModal = false;
  this.itemIdToDelete = null;
}

confirmDelete() {
  if (this.itemIdToDelete !== null) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.delete(`${API_DOMAIN}api/item/removeById/${this.itemIdToDelete}`, { headers, responseType: 'text' })
      .subscribe({
        next: (msg: string) => {
          this.errorMessage = msg;
          this.fetchItems();
          setTimeout(() => this.errorMessage = '', 3000);
        },
        error: err => {
          this.errorMessage = 'Failed to delete item';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }
  this.closeDeleteModal();
}
}
