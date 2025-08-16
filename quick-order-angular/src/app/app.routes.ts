import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
