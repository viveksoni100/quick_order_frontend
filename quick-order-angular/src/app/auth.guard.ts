import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  // Only check localStorage if running in the browser
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem('token') : null;
  if (token) {
    return true;
  } else {
    router.navigateByUrl('/');
    return false;
  }
};