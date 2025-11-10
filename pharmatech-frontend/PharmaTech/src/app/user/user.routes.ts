import { Routes } from '@angular/router';
import { UserComponent } from './user.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { CareerComponent } from './pages/career/career.component';
import { ShopComponent } from './pages/shop/shop.component';
import { CareerDetailsComponent } from './pages/careerDetails/careerDetails.component';
import { ProductDetailsComponent } from './pages/productDetails/productDetails.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ContactUserComponent } from './pages/contact/contact_user.component';
import { CartComponent } from './pages/cart/cart.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'about-us', component: AboutUsComponent },
      { path: 'contact', component: ContactUserComponent },
      { path: 'shop', component: ShopComponent },
      { path: 'career', component: CareerComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'careerDetails/:id', component: CareerDetailsComponent },
      { path: 'productDetails/:id', component: ProductDetailsComponent },
      { path: 'profile/:id', component: ProfileComponent },
      { path: 'cart/:id', component: CartComponent },
      { path: 'wishlist/:id', component: WishlistComponent },
    ],
  },
];
