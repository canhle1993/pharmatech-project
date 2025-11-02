import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./user/user.routes').then((m) => m.userRoutes),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes),
  },
];
