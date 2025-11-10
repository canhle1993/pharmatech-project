import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('api/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /** 💳 API tạo session thanh toán Stripe */
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: { items: any[]; user_id?: string },
  ) {
    return this.stripeService.createCheckoutSession(body.items, body.user_id);
  }
}
