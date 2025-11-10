import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private apiUrl = env.baseUrl + 'stripe/';

  constructor(private http: HttpClient) {}

  /** ✅ Tạo session thanh toán */
  async createCheckoutSession(payload: any): Promise<{ url: string }> {
    return await lastValueFrom(
      this.http.post<{ url: string }>(
        this.apiUrl + 'create-checkout-session',
        payload
      )
    );
  }
}
