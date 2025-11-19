import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('api/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /** 💳 API tạo session thanh toán Stripe */
  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: any) {
    // body gồm: items, user_id, billing_info, success_url, cancel_url
    return this.stripeService.createCheckoutSession(body);
  }

  /**
   * ❌ KHÔNG DÙNG trong Cách A
   * FE sẽ xử lý order sau khi redirect về /payment/success
   * Nhưng giữ lại nếu sau này bạn muốn dùng Webhook
   */
  @Post('create-order-after-payment')
  async createOrderAfterPayment(@Body() body: { user_id: string; billing_info?: any }) {
    return this.stripeService.createOrderAfterPayment(
      body.user_id,
      body.billing_info,
    );
  }
}
