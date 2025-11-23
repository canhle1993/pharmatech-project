import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';

export interface RevenueCategoryDate {
  category: string;
  date: string;
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsMainService {
  private baseUrl = env.baseUrl + 'order/chart/';

  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // 📊 DOANH THU THEO CATEGORY + NGÀY
  // ==================================================
  async getRevenueCategoryDate(): Promise<RevenueCategoryDate[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<RevenueCategoryDate[]>(
          this.baseUrl + 'revenue-category-date'
        )
      );

      // 🚀 Format chuẩn theo style bạn hay dùng
      return res.map((r) => ({
        category: r.category,
        date: r.date,
        totalRevenue: r.totalRevenue,
      }));
    } catch (error) {
      console.error('❌ getRevenueCategoryDate error:', error);
      return [];
    }
  }

  // ================================
  // 📌 TOP 10 PRODUCT BÁN CHẠY THEO NGÀY
  // ================================
  async getTopProducts(): Promise<any[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<any[]>(`${this.baseUrl}top-products`)
      );
      return res;
    } catch (error) {
      console.error('❌ getTopProducts error:', error);
      return [];
    }
  }

  async getProductsByCategory(): Promise<any[]> {
    try {
      const url = env.baseUrl + 'product/products-by-category';

      const res = await lastValueFrom(this.httpClient.get<any[]>(url));

      return res;
    } catch (error) {
      console.error('❌ getProductsByCategory error:', error);
      return [];
    }
  }
}
