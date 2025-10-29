import { Routes } from '@angular/router';
import { UserComponent } from './user.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactComponent } from './pages/contact/contact.component';
import { CareerComponent } from './pages/career/career.component';
import { ShopComponent } from './pages/shop/shop.component';
import { CareerDetailsComponent } from './pages/careerDetails/careerDetails.component';
import { ProductDetailsComponent } from './pages/productDetails/productDetails.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'about-us', component: AboutUsComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'shop', component: ShopComponent },
      { path: 'career', component: CareerComponent },
      { path: 'careerDetails', component: CareerDetailsComponent },
      { path: 'productDetails', component: ProductDetailsComponent },
    ],
  },
];
