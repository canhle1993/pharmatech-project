import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductImage, ProductImageSchema } from './product-image.decorator';
import { ProductImageService } from './product-image.service';
import { ProductImageController } from './product-image.controller';

@Module({
  imports: [
    // Đăng ký schema với Mongoose
    MongooseModule.forFeature([
      { name: ProductImage.name, schema: ProductImageSchema },
    ]),
  ],
  controllers: [ProductImageController],
  providers: [ProductImageService],
  exports: [ProductImageService, MongooseModule], // ✅ cho phép module khác (vd: ProductModule) sử dụng
})
export class ProductImageModule {}
