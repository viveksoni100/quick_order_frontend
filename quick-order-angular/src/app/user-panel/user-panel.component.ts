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
  pageSize: number = 10;
  totalPages: number = 1;

  // Categories state
  showAddCategoryForm = false;
  editCategoryMode = false;
  editCategoryId: number | null = null;
  newCategory: { name: string } = { name: '' };

  // Categories list + pagination/search (separate from items)
  catSearchText: string = '';
  catFiltered: any[] = [];
  catPaginated: any[] = [];
  catCurrentPage: number = 1;
  catPageSize: number = 10;
  catTotalPages: number = 1;

  // Tables state
  tables: any[] = [];
  showAddTableForm = false;
  editTableMode = false;
  editTableId: number | null = null;
  newTable: { tableNo: string; sittingCapacity: number | '' } = { tableNo: '', sittingCapacity: '' };

  // Tables search/pagination
  tableSearchText: string = '';
  tableFiltered: any[] = [];
  tablePaginated: any[] = [];
  tableCurrentPage: number = 1;
  tablePageSize: number = 10;
  tableTotalPages: number = 1;

  // Shared delete modal state (items or categories)
  showDeleteModal = false;            // already present for items; keep unified
  deleteType: 'item' | 'category' | 'table' = 'item';
  idToDelete: number | null = null;

  // Item edit state (missing fields causing errors)
  editMode: boolean = false;
  editItemId: number | null = null;

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

  // Enhance tab switching to load data
  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'items') {
      this.fetchItems();
    }
    if (tab === 'categories') {
      this.fetchCategoriesList();
    }
    if (tab === 'tables') {
      this.fetchTablesList();
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
      image: null,
      isVeg: true,
      isActive: true
    };
    this.fetchCategories();
  }

  onEditItem(item: any) {
    this.editMode = true;
    this.showAddForm = true;
    this.editItemId = item.id;
    // Deep copy to avoid mutating the table directly
    this.newItem = { ...item };
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

    if (this.editMode && this.editItemId !== null) {
      // PATCH for update
      this.http.patch(`${API_DOMAIN}api/item/edit`, payload, { headers, responseType: 'text' }).subscribe({
        next: (msg: string) => {
          this.successMessage = msg;
          this.showAddForm = false;
          this.editMode = false;
          this.editItemId = null;
          this.fetchItems();
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          alert('Failed to update item');
          console.error(err);
        }
      });
    } else {
      // POST for add
      this.http.post(`${API_DOMAIN}api/item/add`, payload, { headers, responseType: 'text' }).subscribe({
        next: (msg: string) => {
          this.successMessage = msg;
          this.showAddForm = false;
          this.fetchItems();
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          alert('Failed to add item');
          console.error(err);
        }
      });
    }
  }

  cancelAddItem() {
    this.showAddForm = false;
    this.editMode = false;
    this.editItemId = null;
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

  // Categories CRUD
  fetchCategoriesList() {
    const menuId = localStorage.getItem('menuId');
    const token = localStorage.getItem('token');
    if (!menuId || !token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`${API_DOMAIN}api/category/getAllByMenuId/${menuId}`, { headers })
      .subscribe({
        next: (data) => {
          this.categories = data;           // reuse existing categories array
          this.applyCatSearchAndPagination();
        },
        error: (err) => {
          this.errorMessage = 'Failed to load categories';
          console.error(err);
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }

  onAddCategory() {
    this.showAddCategoryForm = true;
    this.editCategoryMode = false;
    this.editCategoryId = null;
    this.newCategory = { name: '' };
  }

  onEditCategory(cat: any) {
    this.showAddCategoryForm = true;
    this.editCategoryMode = true;
    this.editCategoryId = cat.id;
    this.newCategory = { name: cat.name };
  }

  cancelAddCategory() {
    this.showAddCategoryForm = false;
    this.editCategoryMode = false;
    this.editCategoryId = null;
    this.newCategory = { name: '' };
  }

  submitCategory() {
    const menuId = localStorage.getItem('menuId');
    const token = localStorage.getItem('token');
    if (!menuId || !token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    if (this.editCategoryMode && this.editCategoryId !== null) {
      const payload = { id: this.editCategoryId, menuId: Number(menuId), name: this.newCategory.name.trim() };
      this.http.patch(`${API_DOMAIN}api/category/edit`, payload, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.successMessage = msg;
            this.cancelAddCategory();
            this.fetchCategoriesList();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            this.errorMessage = 'Failed to update category';
            console.error(err);
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    } else {
      const payload = { menuId: Number(menuId), name: this.newCategory.name.trim() };
      this.http.post(`${API_DOMAIN}api/category/add`, payload, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.successMessage = msg;
            this.cancelAddCategory();
            this.fetchCategoriesList();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            this.errorMessage = 'Failed to add category';
            console.error(err);
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    }
  }

  // Category search/pagination
  onCatSearch() {
    this.catCurrentPage = 1;
    this.applyCatSearchAndPagination();
  }

  onCatPageSizeChange() {
    this.catCurrentPage = 1;
    this.applyCatSearchAndPagination();
  }

  applyCatSearchAndPagination() {
    const search = this.catSearchText?.trim().toLowerCase() || '';
    const source = this.categories || [];
    this.catFiltered = search
      ? source.filter(c => c.name?.toLowerCase().includes(search))
      : [...source];

    this.catTotalPages = Math.ceil(this.catFiltered.length / this.catPageSize) || 1;
    this.catPaginate();
  }

  catPaginate() {
    const start = (this.catCurrentPage - 1) * this.catPageSize;
    const end = start + this.catPageSize;
    this.catPaginated = this.catFiltered.slice(start, end);
  }

  catNextPage() {
    if (this.catCurrentPage < this.catTotalPages) {
      this.catCurrentPage++;
      this.catPaginate();
    }
    return;
  }

  catPrevPage() {
    if (this.catCurrentPage > 1) {
      this.catCurrentPage--;
      this.catPaginate();
    }
    return;
  }

  // Tables CRUD
  fetchTablesList() {
    const outletId = Number(localStorage.getItem('outletId'));
    const token = localStorage.getItem('token');
    if (!outletId || !token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`${API_DOMAIN}api/table/getAllByOutletId/${outletId}`, { headers })
      .subscribe({
        next: (data) => {
          this.tables = data;
          this.applyTableSearchAndPagination();
        },
        error: (err) => {
          this.errorMessage = 'Failed to load tables';
          console.error(err);
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }

  onAddTable() {
    this.showAddTableForm = true;
    this.editTableMode = false;
    this.editTableId = null;
    this.newTable = { tableNo: '', sittingCapacity: '' };
  }

  onEditTable(t: any) {
    // Optionally you can fetch by id to be strict:
    // this.loadTableById(t.id);
    this.showAddTableForm = true;
    this.editTableMode = true;
    this.editTableId = t.id;
    this.newTable = { tableNo: t.tableNo, sittingCapacity: t.sittingCapacity };
  }

  cancelAddTable() {
    this.showAddTableForm = false;
    this.editTableMode = false;
    this.editTableId = null;
    this.newTable = { tableNo: '', sittingCapacity: '' };
  }

  // Optional: load by id for edit (if needed)
  loadTableById(id: number) {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${API_DOMAIN}api/table/getById/${id}`, { headers })
      .subscribe({
        next: (t) => {
          this.showAddTableForm = true;
          this.editTableMode = true;
          this.editTableId = t.id;
          this.newTable = { tableNo: t.tableNo, sittingCapacity: t.sittingCapacity };
        }
      });
  }

  submitTable() {
    const outletId = Number(localStorage.getItem('outletId'));
    const token = localStorage.getItem('token');
    if (!outletId || !token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      ...(this.editTableMode && this.editTableId !== null ? { id: this.editTableId } : {}),
      tableNo: this.newTable.tableNo.trim(),
      outletId,
      sittingCapacity: Number(this.newTable.sittingCapacity)
    };

    if (this.editTableMode && this.editTableId !== null) {
      this.http.patch(`${API_DOMAIN}api/table/edit`, payload, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.successMessage = msg;
            this.cancelAddTable();
            this.fetchTablesList();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            this.errorMessage = 'Failed to update table';
            console.error(err);
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    } else {
      this.http.post(`${API_DOMAIN}api/table/add`, payload, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.successMessage = msg;
            this.cancelAddTable();
            this.fetchTablesList();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            this.errorMessage = 'Failed to add table';
            console.error(err);
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    }
  }

  // Search/Pagination helpers
  onTableSearch() {
    this.tableCurrentPage = 1;
    this.applyTableSearchAndPagination();
  }

  onTablePageSizeChange() {
    this.tableCurrentPage = 1;
    this.applyTableSearchAndPagination();
  }

  applyTableSearchAndPagination() {
    const q = this.tableSearchText?.trim().toLowerCase() || '';
    const src = this.tables || [];
    this.tableFiltered = q
      ? src.filter(t => t.tableNo?.toLowerCase().includes(q))
      : [...src];

    this.tableTotalPages = Math.ceil(this.tableFiltered.length / this.tablePageSize) || 1;
    this.tablePaginate();
  }

  tablePaginate() {
    const start = (this.tableCurrentPage - 1) * this.tablePageSize;
    const end = start + this.tablePageSize;
    this.tablePaginated = this.tableFiltered.slice(start, end);
  }

  tableNextPage() {
    if (this.tableCurrentPage < this.tableTotalPages) {
      this.tableCurrentPage++;
      this.tablePaginate();
    }
  }

  tablePrevPage() {
    if (this.tableCurrentPage > 1) {
      this.tableCurrentPage--;
      this.tablePaginate();
    }
  }

  // Delete modal (support items and categories)
  openDeleteModal(itemId: number) {           // existing for items; keep for compatibility
    this.deleteType = 'item';
    this.idToDelete = itemId;
    this.showDeleteModal = true;
  }

  openDeleteModalForCategory(catId: number) {
    this.deleteType = 'category';
    this.idToDelete = catId;
    this.showDeleteModal = true;
  }

  // Delete: open modal for table
  openDeleteModalForTable(id: number) {
    this.deleteType = 'table';
    this.idToDelete = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.idToDelete = null;
  }

  confirmDelete() {
    const token = localStorage.getItem('token');
    if (!token || this.idToDelete === null) { this.closeDeleteModal(); return; }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (this.deleteType === 'category') {
      this.http.delete(`${API_DOMAIN}api/category/removeById/${this.idToDelete}`, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.errorMessage = msg;
            this.fetchCategoriesList();
            setTimeout(() => this.errorMessage = '', 3000);
          },
          error: () => {
            this.errorMessage = 'Failed to delete category';
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    } else if (this.deleteType === 'table') {
      this.http.delete(`${API_DOMAIN}api/table/removeById/${this.idToDelete}`, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.errorMessage = msg;
            this.fetchTablesList();
            setTimeout(() => this.errorMessage = '', 3000);
          },
          error: () => {
            this.errorMessage = 'Failed to delete table';
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    } else {
      this.http.delete(`${API_DOMAIN}api/item/removeById/${this.idToDelete}`, { headers, responseType: 'text' })
        .subscribe({
          next: (msg: string) => {
            this.errorMessage = msg;
            this.fetchItems();
            setTimeout(() => this.errorMessage = '', 3000);
          },
          error: () => {
            this.errorMessage = 'Failed to delete item';
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
    }

    this.closeDeleteModal();
  }
}
