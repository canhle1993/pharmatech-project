import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.decorator';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

// ✅ Import các module liên quan
import { DepositSettingModule } from '../deposit-setting/deposit-setting.module';
import { OrderDetailsModule } from '../order-details/order-details.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    // ✅ Đăng ký model cho Order
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),

    // ✅ Liên kết các module phụ
    DepositSettingModule,
    OrderDetailsModule,
    StripeModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService], // ⚡ Export để module khác (như Payment) có thể dùng
})
export class OrderModule {}
