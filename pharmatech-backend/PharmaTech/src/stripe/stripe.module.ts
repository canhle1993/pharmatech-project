import { forwardRef, Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [forwardRef(() => OrderModule)], // ✅ tránh circular dependency
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
