import {
  Component,
  OnInit,
  AfterViewInit,
  ViewEncapsulation,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
import Swiper from 'swiper';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

@Component({
  selector: 'app-product-details',
  standalone: true,
  templateUrl: './productDetails.component.html',
  styleUrls: ['./productDetails.component.css'],
  encapsulation: ViewEncapsulation.None, // ✅ quan trọng để Swiper CSS hoạt động

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
    this.autoReloadOnce(); // ✅ Thêm hàm reload 1 lần duy nhất

    const userId = localStorage.getItem('userId');
    if (userId) await this.cartState.loadUserCart(userId);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const res: any = await this.productService.findById(id);
      this.product = res;

      // ✅ nối path ảnh
      if (this.product.photo && !this.product.photo.startsWith('http')) {
        this.product.photo = `${this.imageBase}${this.product.photo}`;
      }
      if (this.product.gallery?.length) {
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
  private autoReloadOnce(): void {
    const reloaded = sessionStorage.getItem('productDetails-page-reloaded');
    if (!reloaded) {
      sessionStorage.setItem('productDetails-page-reloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('productDetails-page-reloaded');
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
    setTimeout(() => {
      Swiper.use([Navigation, Thumbs]);

      // ✅ Thumb swiper
      const thumbs = new Swiper('#thumb-swiper', {
        direction: 'vertical',
        slidesPerView: 4,
        spaceBetween: 10,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        observer: true,
        observeParents: true,
        loop: true, // 🔹 tắt lặp
      });

      // ✅ Main swiper
      const main = new Swiper('#main-swiper', {
        spaceBetween: 10,
        slidesPerView: 1,
        navigation: {
          nextEl: '#main-swiper .swiper-button-next',
          prevEl: '#main-swiper .swiper-button-prev',
        },
        thumbs: { swiper: thumbs },
        observer: true,
        observeParents: true,
        loop: true, // 🔹 tắt lặp
      });

      console.log('✅ Swiper initialized successfully inside Angular!');
    }, 800);
  }
}
