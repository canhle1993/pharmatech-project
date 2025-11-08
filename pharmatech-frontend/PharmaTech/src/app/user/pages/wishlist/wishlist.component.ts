import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Wishlist } from '../../../entities/wishlist.entity';
import { WishlistService } from '../../../services/wishlist.service';
import { CartStateService } from '../../../services/cart-state.service'; // ✅ tái sử dụng state realtime
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ToastModule, ConfirmDialogModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  providers: [MessageService, DatePipe, ConfirmationService],
})
export class WishlistComponent implements OnInit, OnDestroy {
  private wishlistSub!: Subscription;

  /** ❤️ Danh sách wishlist */
  wishlists: Wishlist[] = [];

  /** 🧑 ID người dùng hiện tại */
  userId = '';

  /** ⏳ Trạng thái tải dữ liệu */
  loading = false;

  constructor(
    private wishlistService: WishlistService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private cartService: CartService,
    private cartState: CartStateService // ✅ tái sử dụng state realtime (có thể đổi thành wishlistState sau)
  ) {}

  // ==================================================
  // 🚀 LIFECYCLE HOOKS
  // ==================================================
  async ngOnInit() {
    this.userId =
      this.route.snapshot.paramMap.get('id') ||
      localStorage.getItem('userId') ||
      '';

    if (!this.userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login first',
        detail: 'You must be logged in to view your wishlist.',
      });
      return;
    }

    await this.loadWishlist();
  }
  // ==================================================
  // 🛒 THÊM SẢN PHẨM VÀO GIỎ HÀNG
  // ==================================================
  async addToCartFromWishlist(wishlist: Wishlist) {
    if (!this.userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must log in to add items to cart.',
      });
      return;
    }

    const product: any = wishlist.product || wishlist.product_id;

    if (!product || !product._id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid product',
        detail: 'Could not find product information.',
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
        user_id: this.userId,
        product_id: product._id,
        price: product.price || 0,
        quantity: 1,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Added to Cart',
        detail: `${product.name} has been added to your cart.`,
      });
    } catch (error: any) {
      console.error('❌ addToCartFromWishlist error:', error);

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

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
  }

  // ==================================================
  // ❤️ LOAD DANH SÁCH WISHLIST
  // ==================================================
  async loadWishlist(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.wishlistService.findByUser(this.userId);
      this.wishlists = Array.isArray(res) ? res : [res];

      // ✅ Đồng bộ lại state cho header (tùy project có dùng chung hay không)
      await this.cartState.loadUserCart(this.userId);

      // 🚫 Không cần thông báo khi load thành công
      // this.messageService.add({
      //   severity: 'success',
      //   summary: 'Loaded',
      //   detail: 'Wishlist loaded successfully.',
      // });
    } catch (error) {
      console.error('❌ loadWishlist error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Could not load wishlist items. Please try again.',
      });
    } finally {
      this.loading = false;
    }
  }

  // ==================================================
  // ❌ XOÁ SẢN PHẨM KHỎI WISHLIST
  // ==================================================
  removeItem(wishlist: Wishlist): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${wishlist.productName}" from your wishlist?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        wishlist.loading = true;
        try {
          // 🧩 Gọi xoá 1 lần duy nhất
          await this.wishlistService.remove(wishlist._id || wishlist.id!);

          // 🧩 Cập nhật lại danh sách ở client — KHÔNG cần reload API
          this.wishlists = this.wishlists.filter(
            (w) => (w._id || w.id) !== (wishlist._id || wishlist.id)
          );

          // 🧩 Cập nhật lại header nếu bạn đang dùng realtime cartState
          await this.cartState.loadUserCart(this.userId);

          this.messageService.add({
            severity: 'success',
            summary: 'Removed',
            detail: `"${wishlist.productName}" has been removed from your wishlist.`,
          });
        } catch (error) {
          console.error('❌ removeItem error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Unable to remove item from wishlist.',
          });
        } finally {
          wishlist.loading = false;
        }
      },
    });
  }

  // ==================================================
  // 🧹 XOÁ TOÀN BỘ WISHLIST
  // ==================================================
  clearWishlist(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to clear your entire wishlist?',
      header: 'Confirm Clear',
      icon: 'pi pi-trash',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.loading = true;
        try {
          await this.wishlistService.clearUserWishlist(this.userId);
          this.wishlists = [];

          // ✅ Đồng bộ realtime
          await this.cartState.loadUserCart(this.userId);

          this.messageService.add({
            severity: 'info',
            summary: 'Cleared',
            detail: 'Your wishlist has been cleared successfully.',
          });
        } catch (error) {
          console.error('❌ clearWishlist error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Unable to clear wishlist. Please try again.',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }
}
