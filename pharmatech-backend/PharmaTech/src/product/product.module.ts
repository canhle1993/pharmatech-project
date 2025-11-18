import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.decorator';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryModule } from 'src/category/category.module';
import { Category, CategorySchema } from 'src/category/category.decorator';
import { ProductCategoryModule } from 'src/product-category/product-category.module';
import { ProductImageModule } from 'src/product-image/product-image.module';
import {
  OrderDetails,
  OrderDetailsSchema,
} from 'src/order-details/order-details.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: OrderDetails.name, schema: OrderDetailsSchema },
    ]),
    CategoryModule,
    ProductCategoryModule,
    ProductImageModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }, // ✅ export chính xác model Product
    ]),
    ProductService,
  ],
})
export class ProductModule {}
