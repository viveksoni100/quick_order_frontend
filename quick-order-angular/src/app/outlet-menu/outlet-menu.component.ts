import { Component, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { API_DOMAIN } from '../constants';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-outlet-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './outlet-menu.component.html',
  styleUrl: './outlet-menu.component.css'
})
export class OutletMenuComponent {
  outletId: number | null = null;
  menuId: number | null = null;
  tableId: string | null = null;

  items: any[] = [];
  filteredItems: any[] = [];
  uniqueCategories: string[] = [];
  selectedCategory: string | null = null;
  cart: any[] = [];
  cartTotal: number = 0;
  showCheckout: boolean = false;
  searchText: string = '';

  outletDetails: any | null = null;

  // bill breakup
  sgstAmt = 0;
  cgstAmt = 0;
  platformChargeAmt = 0;
  discountAmt = 0;
  netPayable = 0;
  roundOff = 0;

  preparationNote: string = '';

  private isBrowser = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getFromStorage(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const outletIdParam = params.get('outletId') ?? this.getFromStorage('outletId');
      const menuIdParam = params.get('menuId') ?? this.getFromStorage('menuId');
      this.outletId = outletIdParam ? Number(outletIdParam) : null;
      this.menuId = menuIdParam ? Number(menuIdParam) : null;

      if (this.outletId) this.fetchOutletDetails(this.outletId);
      if (this.menuId) this.fetchItems(this.menuId);
      this.computeBillBreakup();
    });
  }

  fetchOutletDetails(outletId: number) {
    const token = this.getFromStorage('token');
    if (!token) return; // skip on server or when no token
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${API_DOMAIN}api/outlet/getOutletDetailsById/${outletId}`, { headers })
      .subscribe({
        next: (data) => {
          this.outletDetails = data;
          this.computeBillBreakup();
        },
        error: () => {
          // no-op
        }
      });
  }

  fetchItems(menuId: number) {
    const token = this.getFromStorage('token');
    if (!token) { this.items = []; this.filteredItems = []; return; }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`${API_DOMAIN}api/item/getAllByMenuId/${menuId}`, { headers })
      .subscribe({
        next: (data) => {
          this.items = data || [];
          this.uniqueCategories = [...new Set(this.items.map(i => i.category))];
          this.filterItems();
        },
        error: () => {
          this.items = [];
          this.filteredItems = [];
        }
      });
  }

  selectCategory(cat: string | null) {
    this.selectedCategory = cat;
    this.filterItems();
  }

  onSearchChange() {
    this.filterItems();
  }

  filterItems() {
    const base = this.selectedCategory
      ? this.items.filter(i => i.category === this.selectedCategory)
      : this.items;

    const q = (this.searchText || '').trim().toLowerCase();
    this.filteredItems = q.length >= 3
      ? base.filter(i => i.name?.toLowerCase().includes(q))
      : base;
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
    this.computeBillBreakup();
  }

  // call this after any cart change or outlet details load
  computeBillBreakup() {
    const billAmount = this.cartTotal || 0;

    // Treat outlet values as percentages (e.g., 2.5 means 2.5%)
    const pct = 0.01;
    const sgst = this.outletDetails?.sgst ?? 0;
    const cgst = this.outletDetails?.cgst ?? 0;
    const platformCharge = (this.outletDetails?.businessType === 2) ? (this.outletDetails?.platformCharge ?? 0) : 0;
    const discount = this.outletDetails?.discount ?? 0;

    this.sgstAmt = +(billAmount * sgst * pct).toFixed(2);
    this.cgstAmt = +(billAmount * cgst * pct).toFixed(2);
    this.platformChargeAmt = +(billAmount * platformCharge * pct).toFixed(2);
    this.discountAmt = +(billAmount * discount * pct).toFixed(2);

    const gross = billAmount + this.sgstAmt + this.cgstAmt + this.platformChargeAmt - this.discountAmt;

    // Round down to nearest whole rupee (e.g., 235.35 -> 235.00)
    const rounded = Math.floor(gross);
    this.roundOff = +(gross - rounded).toFixed(2);
    this.netPayable = rounded; // integer rupees
  }

  checkout() {
    // Use this.preparationNote when sending order later
    this.cart = [];
    this.updateCartTotal();
    this.preparationNote = '';
    this.showCheckout = true;
    setTimeout(() => this.showCheckout = false, 3000);
  }
}
