import { Routes } from '@angular/router';
import { HomeComponent } from './user/components/home/home.component';
import { AboutUsComponent } from './user/components/about-us/about-us.component';
import { NewsComponent } from './user/components/news/news.component';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { ForgotPasswordComponent } from './auth/components/forgotPassword/forgotPassword.component';
import { AdminComponent } from './admin/admin.component';
import { UserComponent } from './user/user.component';
import { AccountListComponent } from './admin/account/accountlist/accountlist.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'user',
    component: UserComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'user/about-us',
    component: AboutUsComponent,
  },
  {
    path: 'user/news',
    component: NewsComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'admin/account-list',
    component: AccountListComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
];
