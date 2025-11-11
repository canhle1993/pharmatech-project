import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { OrderService } from 'src/order/order.service';

dotenv.config();

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly orderService: OrderService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }

  /** 🧾 Tạo session thanh toán Stripe (chỉ thu tiền deposit) */
  async createCheckoutSession(items: any[], user_id?: string) {
    try {
      // ✅ Lấy dòng Deposit Payment từ items
      const depositItem = items.find(
        (i) => i.product_name === 'Deposit Payment',
      );

      if (!depositItem) {
        throw new HttpException(
          'Deposit item not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      // ✅ Lấy phần trăm đặt cọc & tổng tiền từ mô tả
      const depositPercent =
        depositItem?.description?.match(/Deposit (\d+)%/)?.[1] || '100';

      // ✅ Tạo dòng thanh toán thật duy nhất cho phần cọc
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'usd',
            product_data: {
              name: `💰 Pay Now (Deposit ${depositPercent}%)`,
              description: depositItem.description,
            },
            unit_amount: Math.round(
              parseFloat(depositItem.unit_price || '0') * 100,
            ), // 💰 chỉ thu tiền deposit
          },
          quantity: 1,
        },
      ];

      // ✅ Tạo session thanh toán Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `http://localhost:4200/profile/${user_id || ''}?payment=success`,
        cancel_url: 'http://localhost:4200/checkout?payment=cancel',
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('❌ Stripe error:', error);
      throw new HttpException(
        'Stripe checkout failed: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /** ✅ Sau khi Stripe thanh toán thành công, lưu đơn hàng */
  async createOrderAfterPayment(user_id: string, billing_info?: any) {
    return this.orderService.createAfterPayment(user_id, billing_info);
  }
}
