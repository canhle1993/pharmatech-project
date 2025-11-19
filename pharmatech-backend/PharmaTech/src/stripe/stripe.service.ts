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

  /** 🧾 Tạo session thanh toán Stripe (thu tiền deposit) */
  async createCheckoutSession(data: any) {
    try {
      // FE gửi xuống đầy đủ
      const { items, user_id, billing_info, success_url, cancel_url } = data;

      if (!items || !Array.isArray(items)) {
        throw new HttpException('Invalid items', HttpStatus.BAD_REQUEST);
      }

      if (!user_id) {
        throw new HttpException('Missing user_id', HttpStatus.BAD_REQUEST);
      }

      // 🔎 Tìm item Deposit Payment
      const depositItem = items.find(
        (i) => i.product_name === 'Deposit Payment',
      );

      if (!depositItem) {
        throw new HttpException(
          'Deposit item not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 🔢 Lấy phần trăm cọc từ mô tả
      const depositPercent =
        depositItem?.description?.match(/Deposit (\d+)%/)?.[1] || '100';

      // 💰 Tạo line_items để thu tiền cọc
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'usd',
            product_data: {
              name: `💰 Pay Now (Deposit ${depositPercent}%)`,
              description: depositItem.description,
            },
            unit_amount: Math.round(Number(depositItem.unit_price) * 100),
          },
          quantity: 1,
        },
      ];

      // 🧾 Tạo session Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url, // FE tự gửi → không hardcode nữa
        cancel_url, // FE tự gửi → không hardcode nữa
        customer_email: billing_info?.email || undefined,
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

  /** ❌ KHÔNG dùng nữa trong Cách A — nhưng giữ lại nếu cần */
  async createOrderAfterPayment(
    user_id: string,
    billing_info?: any,
    carts?: any[],
    total_amount?: number,
    deposit_amount?: number,
  ) {
    throw new HttpException(
      'This Stripe endpoint is deprecated. Please call /api/order/create-after-payment instead.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
