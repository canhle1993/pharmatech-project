import {
  Component,
  OnInit,
  OnDestroy,
  Renderer2,
  AfterViewInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { HotlineData, HotlineService } from '../../../services/hotline.service';
import { CategoryService } from '../../../services/category.service';
import { Subscription } from 'rxjs';
import { Cart } from '../../../entities/cart.entity';
import { CartStateService } from '../../../services/cart-state.service';
import { env } from '../../../enviroments/enviroment';

declare var bootstrap: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterLink, ButtonModule, CommonModule],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  user: any = null;
  isLoggedIn = false;
  categories: any[] = [];

  cartCount = 0;
  cartItems: Cart[] = [];
  private cartSub!: Subscription;
  imageBase = env.imageUrl;

  hotlineData: HotlineData = {
    hotlineNumber: '(012) 345-6789',
    storeLocation: '6391 Elgin St. Celina, Delaware 10299',
  };

  constructor(
    private accountService: AccountService,
    private router: Router,
    private hotlineService: HotlineService,
    private categoryService: CategoryService,
    public cartState: CartStateService,
    private renderer: Renderer2
  ) {}

  // =====================================================
  // 🔥 FIX QUAN TRỌNG NHẤT: LẤY USER ĐÚNG SAU KHI LOGIN
  // =====================================================
  async ngOnInit() {
    // 1️⃣ Kiểm tra login đúng theo login.component.ts
    this.isLoggedIn = !!localStorage.getItem('access_token');

    // 2️⃣ Load user đúng format đã lưu
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.user.id = this.user.id || this.user._id;
    }

    // 3️⃣ Nếu user hợp lệ → load giỏ hàng
    const userId = this.user?._id;
    if (userId) {
      await this.cartState.loadUserCart(userId);
    }

    this.loadHotlineData();
    this.loadCategories();

    // 4️⃣ Realtime giỏ hàng
    if (this.user?._id) {
      await this.cartState.loadUserCart(this.user._id);
    }
    this.cartSub = this.cartState.items$.subscribe((items) => {
      this.cartItems = items;
      this.cartCount = this.cartState.getTotalQuantity();
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  get cartTotal(): number {
    return this.cartState.getTotalPrice();
  }

  // Load categories
  async loadCategories() {
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('❌ Load categories failed:', err);
    }
  }

  goToCategory(categoryId: string) {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
  }

  loadHotlineData(): void {
    this.hotlineService.getHotlineInfo().subscribe({
      next: (data: HotlineData) => {
        if (data) this.hotlineData = data;
      },
      error: () => console.log('Using default hotline data'),
    });
  }

  // =====================================================
  // 🚪 LOGOUT (FIX: XÓA ĐÚNG TOKEN)
  // =====================================================
  logout() {
    this.accountService.logout();

    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');

    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }

  getPhoneHref(phoneNumber: string): string {
    return 'tel:' + phoneNumber.replace(/[^0-9]/g, '');
  }

  // =====================================================
  // 🧾 ĐÓNG OFFCANVAS VÀ ĐI ĐẾN TRANG CART
  // =====================================================
  closeCartOffcanvas() {
    const offcanvasElement = document.getElementById('offcanvasCart');
    if (offcanvasElement) {
      const bsOffcanvas =
        bootstrap.Offcanvas.getInstance(offcanvasElement) ||
        new bootstrap.Offcanvas(offcanvasElement);

      bsOffcanvas.hide();

      setTimeout(() => {
        this.router.navigate(['/cart', this.user?.id]);
      }, 300);

      setTimeout(() => {
        document
          .querySelectorAll('.offcanvas-backdrop')
          .forEach((el) => el.remove());
        document.body.classList.remove('offcanvas-open');
        document.body.style.overflow = '';
      }, 600);
    }
  }

  async removeCartItem(id: string) {
    await this.cartState.removeItem(id);
  }

  ngAfterViewInit() {
    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];

    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    const jsFiles = [
      'assets/js/vendor/modernizr-3.11.7.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];

    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
