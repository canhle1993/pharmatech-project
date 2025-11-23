import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  get currentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  }

  hasRole(...roles: string[]) {
    const user = this.currentUser;
    if (!user || !user.roles) return false;

    // Normalize expected roles to lowercase
    const expected = roles.map((r) => r.toLowerCase());

    // Normalize user roles
    const userRoles = Array.isArray(user.roles)
      ? user.roles.map((r: string) => r.toLowerCase())
      : [String(user.roles).toLowerCase()];

    // Compare correctly
    return userRoles.some((r) => expected.includes(r));
  }

  isSuperAdmin() {
    return this.hasRole('superadmin');
  }
  isAdmin() {
    return this.hasRole('admin');
  }
  isUser() {
    return this.hasRole('user');
  }
}
