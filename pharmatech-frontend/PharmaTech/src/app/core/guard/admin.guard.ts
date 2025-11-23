import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthRoleService } from '../auth/auth-role.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private role: AuthRoleService, private router: Router) {}

  canActivate(): boolean {
    if (this.role.isAdmin() || this.role.isSuperAdmin()) {
      return true;
    }

    // Không đủ quyền → đưa ra home
    this.router.navigate(['/']);
    return false;
  }
}
