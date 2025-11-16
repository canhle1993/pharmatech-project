import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Product, ProductSchema } from 'src/product/product.decorator';
import { Category, CategorySchema } from 'src/category/category.decorator';
import { Order, OrderSchema } from 'src/order/order.decorator';
import { Career, CareerSchema } from 'src/career/career.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Career.name, schema: CareerSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
