import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class ApplicationAnalyticsService {
  private baseUrl = env.baseUrl + 'career-analytics/';

  constructor(private httpClient: HttpClient) {}

  /** 🔹 1) Tổng quan dashboard */
  async getOverview(): Promise<any> {
    return await lastValueFrom(this.httpClient.get(this.baseUrl + 'overview'));
  }

  /** 🔹 2) Thống kê theo trạng thái (pending/interview/passed/rejected) */
  async getStatusStats(): Promise<any> {
    return await lastValueFrom(this.httpClient.get(this.baseUrl + 'by-status'));
  }

  /** 🔹 3) Thống kê theo độ tuổi (age_range) */
  async getAgeRangeStats(): Promise<any> {
    return await lastValueFrom(
      this.httpClient.get(this.baseUrl + 'by-age-range')
    );
  }

  /** 🔹 4) Line chart — số lượng apply theo ngày */
  async getDailyApplications(from?: string, to?: string): Promise<any> {
    const query = `daily-applications${
      from || to ? `?from=${from}&to=${to}` : ''
    }`;
    return await lastValueFrom(this.httpClient.get(this.baseUrl + query));
  }

  /** 🔹 5) Top kỹ năng */
  async getTopSkills(limit = 10): Promise<any> {
    return await lastValueFrom(
      this.httpClient.get(this.baseUrl + 'top-skills?limit=' + limit)
    );
  }

  /** 🔹 6) Funnel: pending → assigned → interview → passed → rejected */
  async getResultStats(): Promise<any> {
    return await lastValueFrom(this.httpClient.get(this.baseUrl + 'funnel'));
  }

  /** 🔹 7) Group by department (tuỳ bạn dùng hoặc không) */
  async getDepartmentStats(): Promise<any> {
    return await lastValueFrom(
      this.httpClient.get(this.baseUrl + 'by-department')
    );
  }
}
