import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CartService } from '../../../services/cart.service';
import { Cart } from '../../../entities/cart.entity';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CartStateService } from '../../../services/cart-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  providers: [MessageService, DatePipe, CurrencyPipe, ConfirmationService],
})
export class CartComponent implements OnInit {
  private cartSub!: Subscription;
  /** 🧾 Danh sách giỏ hàng */
  carts: Cart[] = [];

  /** 💰 Tổng tiền */
  totalAmount = 0;

  /** 🧑 ID người dùng hiện tại */
  userId = '';

  /** ⏳ Trạng thái tải dữ liệu */
  loading = false;

  constructor(
    private cartService: CartService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private cartState: CartStateService,
    private router: Router
  ) {}

  // ==================================================
  // 🚀 LIFECYCLE HOOKS
  // ==================================================
  async ngOnInit() {
    // ✅ Lấy userId
    this.userId =
      this.route.snapshot.paramMap.get('id') ||
      localStorage.getItem('userId') ||
      '';

    if (!this.userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login first',
        detail: 'You must be logged in to view your cart.',
      });
      return;
    }

    await this.loadCart();

    // ✅ Theo dõi realtime giỏ hàng (khi header thay đổi)
    this.cartSub = this.cartState.items$.subscribe((items) => {
      this.carts = items;
      this.calcTotal();
    });
  }
  ngOnDestroy() {
    this.cartSub?.unsubscribe();
  }

  // ==================================================
  // 🧾 LOAD GIỎ HÀNG & TÍNH TOÁN
  // ==================================================
  async loadCart(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.cartService.findByUser(this.userId);

      // ✅ Ánh xạ lại tồn kho từ product_id (populate object)
      this.carts = (Array.isArray(res) ? res : [res]).map((c: any) =>
        Object.assign(new Cart(), {
          ...c,
          productStock:
            typeof c.product_id === 'object'
              ? c.product_id.stock_quantity
              : c.productStock || 0,
        })
      );

      this.calcTotal();

      // ✅ Đồng bộ lại state cho header
      await this.cartState.loadUserCart(this.userId);
    } catch (error) {
      console.error('❌ loadCart error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Could not load cart items. Please try again.',
      });
    } finally {
      this.loading = false;
    }
  }
  goToCheckout() {
    if (!this.carts.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empty cart',
        detail: 'Your cart is empty.',
      });
      return;
    }
    this.cartState.saveCheckoutData(this.carts, this.totalAmount);
    this.router.navigate(['/checkout']);
  }

  /** 💰 Tính tổng tiền */
  calcTotal(): void {
    this.totalAmount = this.cartService.calcTotal(this.carts);
  }

  // ==================================================
  // 🧩 THAO TÁC GIỎ HÀNG
  // ==================================================

  /** 🔁 Cập nhật số lượng sản phẩm trong giỏ */
  async updateQuantity(cart: Cart, newQty: number): Promise<void> {
    if (newQty < 1 || cart.loading) return;

    // ✅ Lấy tồn kho thực tế từ product_id (populate)
    const stock =
      typeof cart.product_id === 'object'
        ? cart.product_id.stock_quantity || 0
        : cart.productStock || 0;

    // ✅ Kiểm tra tồn kho
    if (stock > 0 && newQty > stock) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Insufficient stock',
        detail: `Only ${stock} items available in stock.`,
      });
      return;
    }

    cart.loading = true;
    try {
      const updated = await this.cartService.updateQuantity(
        cart._id || cart.id!,
        newQty
      );
      cart.quantity = updated.quantity;
      cart.total_price = updated.total_price;
      this.calcTotal();

      // ✅ Đồng bộ realtime lên header
      await this.cartState.loadUserCart(this.userId);

      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Quantity updated successfully.',
      });
    } catch (error: any) {
      console.error('❌ updateQuantity error:', error);

      // ✅ Kiểm tra nếu là lỗi vượt tồn kho (Error message từ CartService)
      if (error.message?.includes('Only')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Insufficient stock',
          detail: error.message, // ví dụ: "Only 2 items available in stock."
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: 'Could not update quantity. Please retry.',
        });
      }
    } finally {
      cart.loading = false;
    }
  }

  /** ❌ Xóa 1 sản phẩm khỏi giỏ */
  removeItem(cart: Cart): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${cart.productName}" from your cart?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        cart.loading = true;
        try {
          await this.cartService.remove(cart._id || cart.id!);
          this.carts = this.carts.filter((c) => c._id !== cart._id);
          this.calcTotal();

          // ✅ Cập nhật lại header realtime
          await this.cartState.loadUserCart(this.userId);

          this.messageService.add({
            severity: 'success',
            summary: 'Removed',
            detail: 'Product removed successfully.',
          });
        } catch (error) {
          console.error('❌ removeItem error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Unable to remove item from cart.',
          });
        } finally {
          cart.loading = false;
        }
      },
    });
  }

  /** 🧹 Xóa toàn bộ giỏ hàng */
  clearCart(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to clear your entire cart?',
      header: 'Confirm Clear',
      icon: 'pi pi-trash',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.loading = true;
        try {
          await this.cartService.clearUserCart(this.userId);
          this.carts = [];
          this.totalAmount = 0;

          // ✅ Đồng bộ realtime với header
          await this.cartState.loadUserCart(this.userId);

          this.messageService.add({
            severity: 'info',
            summary: 'Cleared',
            detail: 'Your cart has been cleared successfully.',
          });
        } catch (error) {
          console.error('❌ clearCart error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Unable to clear cart. Please try again.',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }
}
