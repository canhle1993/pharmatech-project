import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProductImage } from './product-image.decorator';
import { Model } from 'mongoose';
import { ProductImageDTO } from './product-image.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectModel(ProductImage.name)
    private productImageModel: Model<ProductImage>,
  ) {}

  /** 🔹 Tạo ảnh mới (upload xong) */
  async create(dto: ProductImageDTO): Promise<ProductImage> {
    try {
      const image = new this.productImageModel({
        product_id: dto.product_id,
        url: dto.url,
        caption: dto.caption,
        is_main: dto.is_main || false,
        updated_by: dto.updated_by || 'admin',
      });
      return await image.save();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to create product image',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Lấy ảnh theo product_id */
  async findByProduct(productId: string): Promise<ProductImageDTO[]> {
    const images = await this.productImageModel
      .find({ product_id: productId })
      .sort({ created_at: -1 })
      .exec();

    return images.map((img) =>
      plainToInstance(ProductImageDTO, img.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /** 🔹 Xóa 1 ảnh */
  async delete(id: string): Promise<any> {
    const img = await this.productImageModel.findById(id);
    if (!img) throw new HttpException('Image Not Found', HttpStatus.NOT_FOUND);
    await img.deleteOne();
    return { message: 'Image deleted successfully' };
  }
}
