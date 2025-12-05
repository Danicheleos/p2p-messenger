import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

/**
 * Auth Guard - Protects routes requiring authentication
 */
export const authGuard: CanActivateFn = async () => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Try to load user if not already loaded
  if (!userService.isAuthenticated()) {
    const user = await userService.loadUser();
    if (!user) {
      return router.createUrlTree(['/login']);
    }
  }

  return true;
};

