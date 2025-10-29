import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AccountListComponent } from './pages/account/accountlist/accountlist.component';
import { ProductListComponent } from './pages/product/productlist/productlist.component';
import { CategoryListComponent } from './pages/category/categorylist/categorylist.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'account-list', component: AccountListComponent },
      { path: 'product-list', component: ProductListComponent },
      { path: 'category-list', component: CategoryListComponent },
    ],
  },
];
