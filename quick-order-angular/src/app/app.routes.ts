import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { authGuard } from './auth.guard';
import { UserPanelComponent } from './user-panel/user-panel.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: 'user-panel', component: UserPanelComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
