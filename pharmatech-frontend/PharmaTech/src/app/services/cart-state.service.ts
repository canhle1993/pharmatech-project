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

    if (found) {
      // 🔹 Nếu sản phẩm đã có → cộng dồn số lượng
      found.quantity += item.quantity || 1;
      found.total_price = found.quantity * found.price;

      // 🔹 Gọi API update backend
      await this.cartService.updateQuantity(found._id!, found.quantity);
    } else {
      // 🔹 Nếu sản phẩm mới → thêm mới vào backend
      const created = await this.cartService.addToCart({
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price: item.price,
      });

      // ⚠️ Không phẳng hóa product_id (giữ nguyên object)
      items.push(Object.assign(new Cart(), created));
    }

    this._items.next([...items]); // 🔄 realtime update
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
