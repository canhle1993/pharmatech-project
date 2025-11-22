import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Cart } from '../entities/cart.entity';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private baseUrl = env.baseUrl + 'cart/';

  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU GIỎ HÀNG
  // ==================================================

  /** 🔹 Lấy toàn bộ giỏ hàng (Admin dùng) */
  async findAll(): Promise<Cart[]> {
    const res = await lastValueFrom(
      this.httpClient.get<Cart[]>(this.baseUrl + 'find-all')
    );
    return res.map((r) => Object.assign(new Cart(), r));
  }

  /** 👤 Lấy giỏ hàng theo userId (Client dùng) */
  async findByUser(userId: string): Promise<Cart[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<Cart[] | Cart>(
          this.baseUrl + 'find-by-user/' + userId
        )
      );
      const arr = Array.isArray(res) ? res : [res];
      // ✅ Convert mỗi object JSON sang instance của Cart (để dùng getter)
      return arr.map((r) => Object.assign(new Cart(), r));
    } catch (error) {
      console.error('❌ findByUser error:', error);
      return [];
    }
  }

  // ==================================================
  // ➕ THÊM / CẬP NHẬT / XÓA
  // ==================================================

  async addToCart(data: {
    user_id: string;
    product_id: string;
    quantity?: number;
    price?: number;
  }): Promise<Cart> {
    const res = await lastValueFrom(
      this.httpClient.post<Cart>(this.baseUrl + 'add', data)
    );
    return Object.assign(new Cart(), res);
  }

  async updateQuantity(id: string, quantity: number): Promise<Cart> {
    // ✅ Lấy dữ liệu giỏ hàng hiện tại
    const cartItem = await lastValueFrom(
      this.httpClient.get<Cart>(this.baseUrl + 'find-one/' + id)
    );

    // ✅ Kiểm tra tồn kho (phải có populate product_id)
    const stock =
      typeof cartItem.product_id === 'object'
        ? cartItem.product_id.stock_quantity || 0
        : 0;

    if (stock > 0 && quantity > stock) {
      throw new Error(`Only ${stock} items available in stock.`);
    }

    // ✅ Gửi request cập nhật nếu còn hàng
    const res = await lastValueFrom(
      this.httpClient.put<Cart>(this.baseUrl + 'update-quantity/' + id, {
        quantity,
      })
    );

    return Object.assign(new Cart(), res);
  }

  async remove(id: string): Promise<{ msg: string }> {
    return await lastValueFrom(
      this.httpClient.delete<{ msg: string }>(this.baseUrl + 'remove/' + id)
    );
  }

  async clearUserCart(userId: string): Promise<{ msg: string }> {
    return await lastValueFrom(
      this.httpClient.delete<{ msg: string }>(this.baseUrl + 'clear/' + userId)
    );
  }

  // ==================================================
  // 💵 TÍNH TOÁN FRONTEND
  // ==================================================

  calcTotal(carts: Cart[]): number {
    return carts.reduce((sum, item) => sum + (item.total_price || 0), 0);
  }

  calcQuantity(carts: Cart[]): number {
    return carts.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  checkStock(id: string) {
    return this.httpClient.get(`${env.baseUrl}product/check-stock/${id}`).toPromise();
  }
}
