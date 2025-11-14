import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart } from '../entities/cart.entity';
import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  private _items = new BehaviorSubject<Cart[]>([]);
  items$ = this._items.asObservable();
  private checkoutData: { carts: Cart[]; totalAmount: number } | null = null;

  constructor(private cartService: CartService) {}

  // ==================================================
  // 🧾 Load giỏ hàng từ backend
  // ==================================================
  async loadUserCart(userId: string) {
    try {
      const carts = await this.cartService.findByUser(userId);

      const mapped: Cart[] = carts.map((c) =>
        Object.assign(new Cart(), {
          ...c,
          productStock:
            typeof c.product_id === 'object'
              ? c.product_id.stock_quantity
              : c.productStock, // ✅ thêm để lưu tồn kho
        })
      );

      this._items.next(mapped);
    } catch (err) {
      console.error('❌ loadUserCart error:', err);
      this._items.next([]);
    }
  }

  // ==================================================
  // ➕ Thêm sản phẩm vào giỏ (có đồng bộ backend)
  // ==================================================
  // async addToCart(item: {
  //   user_id: string;
  //   product_id: string;
  //   price: number;
  //   quantity?: number;
  // }) {
  //   const items = [...this._items.value];
  //   const found = items.find(
  //     (c) =>
  //       c.product_id?._id === item.product_id ||
  //       c.product_id === item.product_id
  //   );

  //   if (found) {
  //     // Sản phẩm đã tồn tại → update
  //     found.quantity += item.quantity || 1;
  //     found.total_price = found.quantity * found.price;

  //     await this.cartService.updateQuantity(found._id!, found.quantity);
  //   } else {
  //     // Sản phẩm mới → gọi backend add
  //     await this.cartService.addToCart({
  //       user_id: item.user_id,
  //       product_id: item.product_id,
  //       quantity: item.quantity || 1,
  //       price: item.price,
  //     });
  //   }

  //   // ⭐⭐ QUAN TRỌNG: Reload lại cart từ backend để populate product_id ⭐⭐
  //   await this.loadUserCart(item.user_id);
  // }

  async addToCart(item: {
    user_id: string;
    product_id: string;
    price: number;
    quantity?: number;
  }) {
    const items = [...this._items.value];
    const found = items.find(
      (c) =>
        c.product_id?._id === item.product_id ||
        c.product_id === item.product_id
    );

    try {
      if (found) {
        // ❗ KHÔNG tăng số lượng ở FE
        const newQty = found.quantity + (item.quantity || 1);

        // 🟢 FE chỉ gửi số lượng dự kiến, BE kiểm tra stock
        await this.cartService.updateQuantity(found._id!, newQty);
      } else {
        // 🟢 Sản phẩm mới → giao BE kiểm tra stock luôn
        await this.cartService.addToCart({
          user_id: item.user_id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          price: item.price,
        });
      }

      // 🟢 Luôn reload từ BE để đảm bảo data đúng
      await this.loadUserCart(item.user_id);
    } catch (err: any) {
      // 🛑 Trả lỗi ra ngoài component
      throw new Error(
        err?.error?.message ||
          err?.message ||
          'Cannot add more items. Not enough stock.'
      );

      // 🟢 Rollback lại giỏ hàng đúng từ server
      await this.loadUserCart(item.user_id);
    }
  }

  // ==================================================
  // 🗑️ Xóa 1 sản phẩm
  // ==================================================
  async removeItem(id: string) {
    try {
      await this.cartService.remove(id);
      this._items.next(this._items.value.filter((i) => i._id !== id));
    } catch (err) {
      console.error('❌ removeItem error:', err);
    }
  }

  // ==================================================
  // 🧹 Dọn toàn bộ giỏ hàng
  // ==================================================
  async clear(userId?: string) {
    if (userId) await this.cartService.clearUserCart(userId);
    this._items.next([]);
  }

  // ==================================================
  // 🔢 Tổng số lượng
  // ==================================================
  getTotalQuantity(): number {
    return this._items.value.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }
  clearCart() {
    this._items.next([]);
    localStorage.removeItem('cart');
  }

  // ==================================================
  // 💵 Tổng tiền
  // ==================================================
  getTotalPrice(): number {
    return this._items.value.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0
    );
  }
  // ✅ LƯU / LẤY DỮ LIỆU CHO CHECKOUT
  saveCheckoutData(carts: Cart[], totalAmount: number) {
    this.checkoutData = { carts, totalAmount };
  }
  getCheckoutData() {
    return this.checkoutData;
  }
}
