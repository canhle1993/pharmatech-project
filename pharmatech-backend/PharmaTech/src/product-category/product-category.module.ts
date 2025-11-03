import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductCategory,
  ProductCategorySchema,
} from './product-category.decorator';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { Category, CategorySchema } from 'src/category/category.decorator';
import { Product, ProductSchema } from 'src/product/product.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [ProductCategoryService],
  controllers: [ProductCategoryController],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
