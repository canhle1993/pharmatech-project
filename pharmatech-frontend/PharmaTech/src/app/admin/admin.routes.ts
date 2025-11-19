import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AccountListComponent } from './pages/account/accountlist/accountlist.component';
import { ProductListComponent } from './pages/product/productlist/productlist.component';
import { CategoryListComponent } from './pages/category/categorylist/categorylist.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { BannerComponent } from './pages/banner/banner.component';
import { RecycleAccountComponent } from './pages/recycle/recycle-account/recycle-account.component';
import { RecycleCategoryComponent } from './pages/recycle/recycle-category/recycle-category.component';
import { RecycleProductComponent } from './pages/recycle/recycle-product/recycle-product.component';
import { QuoteComponent } from './pages/quote/quote.component';
import { JobPostingComponent } from './pages/career/job-posting/job-posting.component';

import { DashboardAnalyticsComponent } from './pages/career/analytics/analytics-dashboard.component';
import { OrderListComponent } from './pages/order/order-list/order-list.component';
import { OrderDetailsComponent } from './pages/order/order-details/order-details.component';
import { ChatComponent } from './pages/support/chat/chat.component';
import { ChatHistoryComponent } from './pages/support/chat-history/chat-history.component';
import { AccountDetailsComponent } from './pages/account/accountdetails/accountdetails.component';
import { CategoryDetailsComponent } from './pages/category/categorydetails/categorydetails.component';
import { ProductAddComponent } from './pages/product/productAdd/productAdd.component';
import { ProductDetailsComponent } from './pages/product/productDetails/productDetails.component';
import { HotlineInfoComponent } from './pages/settings/HotlineInfo/HotlineInfo.component';
import { ProductEditComponent } from './pages/product/productEdit/productEdit.component';
import { JobFormComponent } from './pages/career/job-posting/job-form/job-form.component';
import { ApplicationManagementComponent } from './pages/career/application-management/application-management.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'account-list', component: AccountListComponent },
      { path: 'account-details/:id', component: AccountDetailsComponent },

      { path: 'product-list', component: ProductListComponent },
      { path: 'product-add', component: ProductAddComponent },
      { path: 'product-details/:id', component: ProductDetailsComponent },
      { path: 'product-edit/:id', component: ProductEditComponent },

      { path: 'category-list', component: CategoryListComponent },
      { path: 'category-details/:id', component: CategoryDetailsComponent },

      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'banner', component: BannerComponent },
      { path: 'settings/hotline', component: HotlineInfoComponent },

      { path: 'recycle/user', component: RecycleAccountComponent },
      { path: 'recycle/category', component: RecycleCategoryComponent },
      { path: 'recycle/product', component: RecycleProductComponent },
      { path: 'quote', component: QuoteComponent },

      { path: 'career/job-posting', component: JobPostingComponent },
      { path: 'career/job-add', component: JobFormComponent },
      { path: 'career/job-edit/:id', component: JobFormComponent },

      {
        path: 'career/application-management',
        component: ApplicationManagementComponent,
      },
      {
        path: 'career/analytics-dashboard',
        component: DashboardAnalyticsComponent,
      },
      { path: 'order/order-list', component: OrderListComponent },
      { path: 'order/order-details', component: OrderDetailsComponent },
      { path: 'support/chat', component: ChatComponent },
      { path: 'support/chat-history', component: ChatHistoryComponent },
    ],
  },
];
