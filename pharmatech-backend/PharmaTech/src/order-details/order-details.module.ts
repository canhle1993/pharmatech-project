import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderDetails, OrderDetailsSchema } from './order-details.decorator';
import { OrderDetailsService } from './order-details.service';
import { OrderDetailsController } from './order-details.controller';

// ⬇️ Import ProductModule để inject ProductService lấy snapshot
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderDetails.name, schema: OrderDetailsSchema },
    ]),
    ProductModule,
  ],
  controllers: [OrderDetailsController],
  providers: [OrderDetailsService],
  exports: [
    OrderDetailsService,
    MongooseModule.forFeature([
      { name: OrderDetails.name, schema: OrderDetailsSchema },
    ]),
  ],
})
export class OrderDetailsModule {}
