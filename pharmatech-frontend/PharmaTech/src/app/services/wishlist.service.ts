import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private baseUrl = env.baseUrl + 'wishlist/';

  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // ❤️ LẤY DỮ LIỆU WISHLIST
  // ==================================================

  /** 🔹 Lấy toàn bộ wishlist (Admin dùng) */
  async findAll(): Promise<Wishlist[]> {
    const res = await lastValueFrom(
      this.httpClient.get<Wishlist[]>(this.baseUrl + 'find-all')
    );
    return res.map((r) => Object.assign(new Wishlist(), r));
  }

  /** 👤 Lấy wishlist theo userId (Client dùng) */
  async findByUser(userId: string): Promise<Wishlist[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<Wishlist[] | Wishlist>(
          this.baseUrl + 'find-by-user/' + userId
        )
      );
      const arr = Array.isArray(res) ? res : [res];
      // ✅ Convert mỗi object JSON sang instance của Wishlist (để dùng getter)
      return arr.map((r) => Object.assign(new Wishlist(), r));
    } catch (error) {
      console.error('❌ findByUser error:', error);
      return [];
    }
  }

  // ==================================================
  // ➕ THÊM / ❌ XÓA
  // ==================================================

  /** ➕ Thêm sản phẩm vào wishlist */
  async addToWishlist(data: {
    user_id: string;
    product_id: string;
  }): Promise<Wishlist> {
    const res = await lastValueFrom(
      this.httpClient.post<Wishlist>(this.baseUrl + 'add', data)
    );
    return Object.assign(new Wishlist(), res);
  }

  /** ❌ Xóa sản phẩm khỏi wishlist */
  async remove(id: string): Promise<{ msg: string }> {
    return await lastValueFrom(
      this.httpClient.delete<{ msg: string }>(this.baseUrl + 'remove/' + id)
    );
  }

  /** 🧹 Xóa toàn bộ wishlist của user */
  async clearUserWishlist(userId: string): Promise<{ msg: string }> {
    return await lastValueFrom(
      this.httpClient.delete<{ msg: string }>(this.baseUrl + 'clear/' + userId)
    );
  }
}
