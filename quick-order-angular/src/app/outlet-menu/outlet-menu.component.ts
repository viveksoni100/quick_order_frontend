import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { API_DOMAIN } from '../constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-outlet-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outlet-menu.component.html',
  styleUrl: './outlet-menu.component.css'
})
export class OutletMenuComponent {
  outletId: string | null = null;
  menuId: string | null = null;
  tableId: string | null = null;

  items: any[] = [];
  filteredItems: any[] = [];
  uniqueCategories: string[] = [];
  selectedCategory: string | null = null;
  cart: any[] = [];
  cartTotal: number = 0;
  showCheckout: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    this.route.queryParamMap.subscribe(params => {
      this.outletId = params.get('outletId');
      this.menuId = params.get('menuId');
      this.tableId = params.get('tableId');
    });
  }

  ngOnInit() {
    this.fetchItems();
  }

  fetchItems() {
    const menuId = this.menuId;
    if (!menuId) return;
    this.http.get<any[]>(`${API_DOMAIN}api/outlet/getAllItemsByMenuId/${menuId}`).subscribe(data => {
      this.items = data;
      this.uniqueCategories = [...new Set(this.items.map(i => i.category))];
      this.filterItems();
    });
  }

  selectCategory(cat: string | null) {
  this.selectedCategory = cat;
  this.filterItems();
}

filterItems() {
  this.filteredItems = this.selectedCategory
    ? this.items.filter(i => i.category === this.selectedCategory)
    : this.items;
}

addToCart(item: any) {
  const found = this.cart.find(ci => ci.id === item.id);
  if (found) {
    found.quantity += 1;
  } else {
    this.cart.push({ ...item, quantity: 1 });
  }
  this.updateCartTotal();
}

removeFromCart(item: any) {
  this.cart = this.cart.filter(ci => ci.id !== item.id);
  this.updateCartTotal();
}

updateCartTotal() {
  this.cartTotal = this.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

checkout() {
  this.cart = [];
  this.cartTotal = 0;
  this.showCheckout = true;
  setTimeout(() => this.showCheckout = false, 3000);
}
}
