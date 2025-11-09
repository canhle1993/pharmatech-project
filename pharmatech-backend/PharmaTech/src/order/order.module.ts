// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.decorator';
import { DepositSettingModule } from 'src/deposit-setting/deposit-setting.module';
import { OrderDetailsModule } from 'src/order-details/order-details.module';

@Module({
  // ✅ Đăng ký schema Order với Mongoose
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    DepositSettingModule,
    OrderDetailsModule,
  ],

  // ⚙️ Nếu sau này có controller/service thì add vào đây
  controllers: [],
  providers: [],
  exports: [MongooseModule], // 👉 Cho phép module khác import dùng model này
})
export class OrderModule {}
