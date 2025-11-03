import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './category.decorator';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ProductCategoryModule } from 'src/product-category/product-category.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    ProductCategoryModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, MongooseModule],
})
export class CategoryModule {}
