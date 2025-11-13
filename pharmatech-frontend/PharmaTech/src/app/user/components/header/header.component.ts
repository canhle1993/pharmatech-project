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
  imageBase = env.imageUrl; // 🌐 base URL ảnh cho tất cả sản phẩm

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

  async ngOnInit() {
    // 🔹 Xác thực login
    this.isLoggedIn = !!localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    this.loadHotlineData();
    this.loadCategories();

    // 🔹 Load giỏ hàng ban đầu (nếu có user)
    if (this.user?._id) {
      await this.cartState.loadUserCart(this.user._id);
    }

    // 🔹 Theo dõi realtime (khi thêm hoặc xóa)
    this.cartSub = this.cartState.items$.subscribe((items) => {
      this.cartItems = items;
      this.cartCount = this.cartState.getTotalQuantity();
    });
  }

  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  // 💰 Tổng tiền giỏ hàng realtime
  get cartTotal(): number {
    return this.cartState.getTotalPrice();
  }

  // 🏷️ Load danh mục
  async loadCategories() {
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('❌ Load categories failed:', err);
    }
  }

  // 🔗 Điều hướng category
  goToCategory(categoryId: string) {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
  }

  // ☎️ Hotline
  loadHotlineData(): void {
    this.hotlineService.getHotlineInfo().subscribe({
      next: (data: HotlineData) => {
        if (data) this.hotlineData = data;
      },
      error: () => console.log('Using default hotline data'),
    });
  }

  // 🚪 Logout
  logout() {
    this.accountService.logout();
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }

  // 📞 Tạo link call
  getPhoneHref(phoneNumber: string): string {
    return 'tel:' + phoneNumber.replace(/[^0-9]/g, '');
  }

  // 🧾 Đóng giỏ hàng và mở trang Cart
  closeCartOffcanvas() {
    const offcanvasElement = document.getElementById('offcanvasCart');
    if (offcanvasElement) {
      const bsOffcanvas =
        bootstrap.Offcanvas.getInstance(offcanvasElement) ||
        new bootstrap.Offcanvas(offcanvasElement);

      // 🔹 1. Đóng cart
      bsOffcanvas.hide();

      // 🔹 2. Chuyển sang trang cart sau animation
      setTimeout(() => {
        this.router.navigate(['/cart', this.user?._id]);
      }, 300);

      // 🔹 3. Xóa backdrop + class gây khóa body
      setTimeout(() => {
        document
          .querySelectorAll('.offcanvas-backdrop')
          .forEach((el) => el.remove());

        // ❗ Rất quan trọng: Bootstrap thêm class này để khóa cuộn
        document.body.classList.remove('offcanvas-open');
        document.body.style.overflow = ''; // khôi phục scroll
      }, 600);
    }
  }

  // ❌ Xóa sản phẩm trong mini-cart
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
