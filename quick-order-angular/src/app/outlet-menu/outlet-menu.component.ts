import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-outlet-menu',
  standalone: true,
  imports: [],
  templateUrl: './outlet-menu.component.html',
  styleUrl: './outlet-menu.component.css'
})
export class OutletMenuComponent {
  outletId: string | null = null;
  menuId: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      this.outletId = params.get('outletId');
      this.menuId = params.get('menuId');
    });
  }
}
