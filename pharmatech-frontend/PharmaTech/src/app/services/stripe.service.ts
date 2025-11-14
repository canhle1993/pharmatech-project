import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private apiUrl = env.baseUrl + 'stripe/';

  constructor(private http: HttpClient) {}

  /** 🎯 Tạo session thanh toán Stripe */
  async createCheckoutSession(payload: any): Promise<{ url: string }> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser?._id || localStorage.getItem('userId');

    if (!userId) {
      throw new Error('User not logged in');
    }

    // FE gửi đầy đủ dữ liệu để BE xử lý
    const body = {
      ...payload, // items + billing_info (FE tạo)
      user_id: userId, // người dùng hiện tại
      success_url: window.location.origin + `/payment/success?uid=${userId}`,
      cancel_url: window.location.origin + `/payment/cancel?uid=${userId}`,
    };

    return await lastValueFrom(
      this.http.post<{ url: string }>(
        this.apiUrl + 'create-checkout-session',
        body
      )
    );
  }
}
