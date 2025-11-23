import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthRoleService } from '../auth/auth-role.service';

@Injectable({ providedIn: 'root' })
export class CareerAdminGuard implements CanActivate {
  constructor(private role: AuthRoleService, private router: Router) {}

  canActivate(): boolean {
    if (this.role.isSuperAdmin() || this.role.isAdmin()) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
