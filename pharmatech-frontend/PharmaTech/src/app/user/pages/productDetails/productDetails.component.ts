import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Product } from '../../../entities/product.entity';
import { env } from '../../../enviroments/enviroment';
import { ProductService } from '../../../services/product.service';
import { WishlistService } from '../../../services/wishlist.service';
import { CartStateService } from '../../../services/cart-state.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  templateUrl: './productDetails.component.html',
  styleUrls: ['./productDetails.component.css'],
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class ProductDetailsComponent implements OnInit, AfterViewInit {
  product!: Product;
  loading = true;
  imageBase = env.imageUrl;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private productService: ProductService,
    private messageService: MessageService,
    private cartService: CartService,
    private cartState: CartStateService,
    private wishlistService: WishlistService
  ) {}

  async ngOnInit() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // ✅ Load lại giỏ hàng từ DB để đồng bộ state (fix lỗi F5 mất state)
      await this.cartState.loadUserCart(userId);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const res: any = await this.productService.findById(id);
      this.product = res;

      // ✅ Ghép đường dẫn đầy đủ cho ảnh chính
      if (this.product.photo && !this.product.photo.startsWith('http')) {
        this.product.photo = `${this.imageBase}${this.product.photo}`;
      }

      // ✅ Ghép đường dẫn đầy đủ cho gallery
      if (this.product.gallery && this.product.gallery.length > 0) {
        this.product.gallery = this.product.gallery.map((img: string) =>
          img.startsWith('http') ? img : `${this.imageBase}${img}`
        );
      }
    } catch (error) {
      console.error('❌ Load product details failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load product details.',
      });
    } finally {
      this.loading = false;
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

  ngAfterViewInit() {
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
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
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
