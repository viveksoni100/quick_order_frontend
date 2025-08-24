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

  // checkout modal
  showCheckoutModal = false;
  customerName = '';
  customerPhone = '';
  customerEmail = '';
  formSubmitted = false;

  // NEW: modal error + submitting state
  modalError: string = '';
  isSubmitting = false;

  clientIp: string = '';

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
      if (this.isBrowser) this.fetchClientIp();   // fetch public IP
      this.computeBillBreakup();
    });
  }

  // Fetch public IP with fallback
  private fetchClientIp() {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json')
      .subscribe({
        next: (res) => this.clientIp = (res?.ip || '').trim(),
        error: () => {
          // fallback to plain-text endpoint
          this.http.get('https://ifconfig.me/ip', { responseType: 'text' })
            .subscribe({
              next: (ip) => this.clientIp = (ip || '').trim(),
              error: () => this.clientIp = ''
            });
        }
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

  openCheckoutModal() {
    this.formSubmitted = false;
    this.modalError = '';
    this.isSubmitting = false;
    this.showCheckoutModal = true;
  }

  closeCheckoutModal() {
    this.showCheckoutModal = false;
    this.isSubmitting = false;
    this.modalError = '';
  }

  isValidPhone(v: string | null | undefined): boolean {
    const s = (v || '').replace(/[^0-9]/g, '');
    return s.length >= 7; // simple validation
  }

  proceedToPayment() {
    this.formSubmitted = true;
    this.modalError = '';
    if (!this.customerName?.trim() || !this.isValidPhone(this.customerPhone)) {
      return;
    }

    const token = this.getFromStorage('token');
    if (!token) {
      this.modalError = 'Unauthorized. Please log in again.';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const nowIso = new Date().toISOString();
    const orderQty = this.cart.reduce((sum, i) => sum + i.quantity, 0);

    const sgstPerc = this.outletDetails?.sgst ?? 0;
    const cgstPerc = this.outletDetails?.cgst ?? 0;
    const platformChargePerc = this.outletDetails?.businessType === 2 ? (this.outletDetails?.platformCharge ?? 0) : 0;
    const discountPerc = this.outletDetails?.discount ?? 0;
    const taxPerc = this.outletDetails?.tax ?? 0;

    // Include createdAt/updatedAt for each order item (DB requires non-null created_at)
    const orderItems = this.cart.map(i => ({
      itemId: i.id,
      unitPrice: Number(i.price),
      quantity: Number(i.quantity),
      totalAmount: Number(i.price) * Number(i.quantity),
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    const payload = {
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      customerEmail: (this.customerEmail || '').trim() || null,

      billAmount: Number(this.cartTotal),
      netPayableAmount: Number(this.netPayable),

      tax: Number(taxPerc),
      discountPerc: Number(discountPerc),
      discountAmount: Number(this.discountAmt),

      platformChargePerc: Number(platformChargePerc),
      platformChargeAmount: Number(this.platformChargeAmt),

      outletId: Number(this.outletId ?? 0),
      orderQty: Number(orderQty),

      preparationNotes: this.preparationNote?.trim() || '',
      status: 1,

      createdAt: nowIso,
      updatedAt: nowIso,

      ipAddress: this.clientIp,              // use fetched IP
      device: this.isBrowser ? navigator.userAgent : '',

      sgstPerc: Number(sgstPerc),
      cgstPerc: Number(cgstPerc),
      sgstAmount: Number(this.sgstAmt),
      cgstAmount: Number(this.cgstAmt),

      roundOffAmount: Number(this.roundOff),

      orderItems
    };

    this.isSubmitting = true;
    this.http.post(`${API_DOMAIN}api/order/create`, payload, { headers, responseType: 'text' })
      .subscribe({
        next: (msg: string) => {
          this.isSubmitting = false;
          this.closeCheckoutModal();
          this.cart = [];
          this.preparationNote = '';
          this.customerName = '';
          this.customerPhone = '';
          this.customerEmail = '';
          this.updateCartTotal();
          this.showCheckout = true;
          setTimeout(() => (this.showCheckout = false), 10000);
        },
        error: (err) => {
          this.isSubmitting = false;
          // Prefer backend text, fall back to generic message
          const backendMsg = typeof err?.error === 'string' ? err.error : (err?.message || 'Failed to create order.');
          this.modalError = backendMsg;
        }
      });
  }
}
