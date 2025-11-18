import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AccountListComponent } from './pages/account/accountlist/accountlist.component';
import { ProductListComponent } from './pages/product/productlist/productlist.component';
import { CategoryListComponent } from './pages/category/categorylist/categorylist.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { BannerComponent } from './pages/banner/banner.component';

import { QuoteComponent } from './pages/quote/quote.component';
import { RecruitmentHistoryComponent } from './pages/career/recruitment-history/recruitment-history.component';
import { OrderDetailsComponent } from './pages/order/order-details/order-details.component';
import { ChatComponent } from './pages/support/chat/chat.component';
import { AccountDetailsComponent } from './pages/account/accountdetails/accountdetails.component';
import { CategoryDetailsComponent } from './pages/category/categorydetails/categorydetails.component';
import { ProductAddComponent } from './pages/product/productAdd/productAdd.component';
import { ProductDetailsComponent } from './pages/product/productDetails/productDetails.component';
import { HotlineInfoComponent } from './pages/settings/HotlineInfo/HotlineInfo.component';
import { ProductEditComponent } from './pages/product/productEdit/productEdit.component';
import { HomeCategoryComponent } from './pages/settings/homeCategory/homeCategory.component';
import { JobFormComponent } from './pages/career/job-posting/job-form/job-form.component';
import { JobPostingComponent } from './pages/career/job-posting/job-posting.component';
import { DepositSettingListComponent } from './pages/settings/depositSettingList/depositSettingList.component';
import { OrderListComponent } from './pages/order/orderlist/orderlist.component';
import { OrderHistoryComponent } from './pages/order/order-history/order-history.component';
import { ApplicationManagementComponent } from './pages/career/application-management/application-management.component';
import { ProductStockManagementComponent } from './pages/product/product-stock-management/product-stock-management.component';
import { ReturnListComponent } from './pages/order/return-list/return-list.component';
import { RecycleComponent } from './pages/recycle/recycle-product-category/recycle.component';

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
      { path: 'product-add', component: ProductAddComponent },
      {
        path: 'product-stock-management',
        component: ProductStockManagementComponent,
      },

      { path: 'category-list', component: CategoryListComponent },
      { path: 'category-details/:id', component: CategoryDetailsComponent },

      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'banner', component: BannerComponent },
      { path: 'settings/hotline', component: HotlineInfoComponent },
      { path: 'settings/homecategory', component: HomeCategoryComponent },
      { path: 'settings/deposit', component: DepositSettingListComponent },

      { path: 'recycle/product-category', component: RecycleComponent },

      { path: 'quote', component: QuoteComponent },

      { path: 'career/job-posting', component: JobPostingComponent },
      { path: 'career/job-add', component: JobFormComponent },
      { path: 'career/job-edit/:id', component: JobFormComponent },

      {
        path: 'career/application-management',
        component: ApplicationManagementComponent,
      },
      {
        path: 'career/recruitment-history',
        component: RecruitmentHistoryComponent,
      },

      { path: 'order/order-list', component: OrderListComponent },
      { path: 'order/order-history', component: OrderHistoryComponent },
      { path: 'order/order-details/:id', component: OrderDetailsComponent },
      { path: 'order/return-list', component: ReturnListComponent },

      { path: 'support/chat', component: ChatComponent },
    ],
  },
];
