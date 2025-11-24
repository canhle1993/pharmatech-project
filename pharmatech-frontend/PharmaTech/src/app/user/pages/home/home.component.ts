import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ thêm dòng này
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { HomeCategoryService } from '../../../services/homeCategory.service';
import { env } from '../../../enviroments/enviroment';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { WishlistService } from '../../../services/wishlist.service';
import { Wishlist } from '../../../entities/wishlist.entity';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterLink, ToastModule],
  providers: [MessageService],
})
export class HomeComponent implements OnInit, AfterViewInit {
  imageBase = env.imageUrl; // ✅ thêm dòng này
  careers: Career[] = [];

  homeCategories: any = null;
  productsCat1: any[] = [];
  productsCat2: any[] = [];
  productsCat3: any[] = [];

  constructor(
    private renderer: Renderer2,
    private productService: ProductService,
    private homeCategoryService: HomeCategoryService,
    private careerService: CareerService,
    private messageService: MessageService,
    private cartService: CartService,
    private cartState: CartStateService,
    private wishlistService: WishlistService
  ) {}

  async ngOnInit() {
    this.autoReloadOnce();
    const userId = localStorage.getItem('userId');
    if (userId) {
      // ✅ Load lại giỏ hàng từ DB để đồng bộ state (fix lỗi F5 mất state)
      await this.cartState.loadUserCart(userId);
    }
    await this.loadHomeCategories();
    await this.loadCareers(); // ✅ thêm gọi API career
  }
  private autoReloadOnce(): void {
    const reloaded = sessionStorage.getItem('home-page-reloaded');
    if (!reloaded) {
      sessionStorage.setItem('home-page-reloaded', 'true');
      console.log('🔄 Reloading home page once...');
      window.location.reload();
    } else {
      sessionStorage.removeItem('home-page-reloaded');
    }
  }
  async addToWishlist(product: any) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must log in to add items to wishlist.',
      });
      return;
    }

    try {
      // ✅ Gọi API thêm sản phẩm vào wishlist
      await this.wishlistService.addToWishlist({
        user_id: userId,
        product_id: product._id || product.id,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Added to Wishlist',
        detail: `${product.name} has been added to your wishlist.`,
      });
    } catch (error: any) {
      console.error('❌ addToWishlist error:', error);

      // ✅ Nếu sản phẩm đã tồn tại (409 Conflict)
      const backendMsg =
        error?.error?.message || error?.message || 'Unable to add to wishlist.';

      const isConflict =
        error?.status === 409 || backendMsg.includes('already in wishlist');

      this.messageService.add({
        severity: isConflict ? 'info' : 'error',
        summary: isConflict ? 'Already in Wishlist' : 'Failed',
        detail: isConflict
          ? `${product.name} is already in your wishlist.`
          : backendMsg,
      });
    }
  }

  async addToCart(product: any) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must log in to add items to cart.',
      });
      return;
    }

    // ✅ Kiểm tra tồn kho trước khi thêm
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Out of stock',
        detail: `${product.name} is currently out of stock.`,
      });
      return;
    }

    // ✅ Kiểm tra nếu đã có trong giỏ hàng và sắp vượt tồn kho
    const existingItem = this.cartState['_items']
      .getValue()
      .find(
        (i) => i.product_id?._id === product._id || i.product_id === product._id
      );

    if (existingItem && existingItem.quantity + 1 > product.stock_quantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock limit reached',
        detail: `Only ${product.stock_quantity} items are available in stock.`,
      });
      return;
    }

    try {
      // ✅ Thêm sản phẩm vào giỏ (qua CartStateService)
      await this.cartState.addToCart({
        user_id: userId,
        product_id: product._id || product.id,
        price: product.price || 0,
        quantity: 1,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Added to Cart',
        detail: `${product.name} has been added to your cart.`,
      });
    } catch (error: any) {
      console.error('❌ addToCart error:', error);

      // ✅ Lấy thông báo cụ thể từ backend nếu có
      const backendMsg =
        error?.error?.message ||
        error?.message ||
        'Unable to add product to cart. Please try again.';

      this.messageService.add({
        severity: 'error',
        summary: 'Failed',
        detail: backendMsg,
      });
    }
  }

  async loadHomeCategories() {
    try {
      const res: any = await this.homeCategoryService.find();
      console.log('✅ API Home Categories:', res);
      this.homeCategories = res;

      const allProducts: any = await this.productService.findAll();
      console.log('✅ Tổng sản phẩm:', allProducts.length);

      if (res.category1)
        this.productsCat1 = allProducts.filter(
          (p: any) =>
            p.stock_quantity > 0 &&
            p.category_ids?.some(
              (id: any) =>
                id?.toString() ===
                (res.category1._id?.toString() || res.category1.toString())
            )
        );

      if (res.category2)
        this.productsCat2 = allProducts.filter(
          (p: any) =>
            p.stock_quantity > 0 &&
            p.category_ids?.some(
              (id: any) =>
                id?.toString() ===
                (res.category2._id?.toString() || res.category2.toString())
            )
        );

      if (res.category3)
        this.productsCat3 = allProducts.filter(
          (p: any) =>
            p.stock_quantity > 0 &&
            p.category_ids?.some(
              (id: any) =>
                id?.toString() ===
                (res.category3._id?.toString() || res.category3.toString())
            )
        );

      console.log('✅ Cat1:', this.productsCat1);
      console.log('✅ Cat2:', this.productsCat2);
      console.log('✅ Cat3:', this.productsCat3);
    } catch (err) {
      console.error('❌ Lỗi tải Home Categories:', err);
    }
  }

  /** 🔹 Load danh sách job */
  async loadCareers() {
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];
    } catch (err) {
      console.error('❌ Lỗi tải Career:', err);
    }
  }

  truncateHTML(html: string, wordLimit: number): string {
    if (!html) return '';
    // Xóa thẻ HTML để tính số từ
    const text = html.replace(/<[^>]*>/g, '').split(/\s+/);
    const truncated = text.slice(0, wordLimit).join(' ');
    return truncated + (text.length > wordLimit ? '...' : '');
  }

  ngAfterViewInit() {
    // Load CSS
    this.loadCSS();

    // Delay JS execution để Angular vẽ xong UI
    setTimeout(() => {
      this.loadScriptsSequential([
        'assets/js/vendor/jquery-3.6.0.min.js',
        'assets/js/vendor/jquery-migrate-3.3.2.min.js',
        'assets/js/vendor/bootstrap.bundle.min.js',
        'assets/js/countdown.min.js',
        'assets/js/ajax.js',
        'assets/js/jquery.validate.min.js',
        'assets/js/swiper-bundle.min.js',
        'assets/js/ion.rangeSlider.min.js',
        'assets/js/lightgallery.min.js',
        'assets/js/jquery.magnific-popup.min.js',
        'assets/js/main.js',
      ]);
    }, 300);

    // --- CSS ---
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
      link.href = `${href}?v=${Date.now()}`; // 🔥 FIX QUAN TRỌNG
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
    const jsFiles = [
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];
    this.loadScriptsSequential(jsFiles);

    // jsFiles.forEach((src) => {
    //   const script = this.renderer.createElement('script');
    //   script.src = `${src}?v=${Date.now()}`; // 🔥 FIX QUAN TRỌNG
    //   script.type = 'text/javascript';
    //   this.renderer.appendChild(document.body, script);
    // });
  }
  private loadCSS() {
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
      link.href = `${href}?v=${Date.now()}`;
      this.renderer.appendChild(document.head, link);
    });
  }

  private loadScriptsSequential(files: string[]) {
    if (files.length === 0) return;

    const src = files.shift()!;
    const script = this.renderer.createElement('script');
    script.src = `${src}?v=${Date.now()}`;
    script.type = 'text/javascript';

    script.onload = () => {
      this.loadScriptsSequential(files);
    };

    this.renderer.appendChild(document.body, script);
  }
}
