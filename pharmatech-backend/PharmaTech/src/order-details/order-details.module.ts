// src/order-details/order-details.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderDetails, OrderDetailsSchema } from './order-details.decorator';
import { Product } from 'src/product/product.decorator';
import { ProductModule } from 'src/product/product.module';

@Module({
  // ✅ Đăng ký schema OrderDetails
  imports: [
    MongooseModule.forFeature([
      { name: OrderDetails.name, schema: OrderDetailsSchema },
    ]),
    ProductModule,
  ],

  // ⚙️ Controller & Service sẽ thêm sau (khi CRUD)
  controllers: [],
  providers: [],
  exports: [MongooseModule], // Cho phép module khác import
})
export class OrderDetailsModule {}
