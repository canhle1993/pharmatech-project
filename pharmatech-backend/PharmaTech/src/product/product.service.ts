import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { Product, ProductDocument } from './product.decorator';
import { ProductDTO } from './product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<ProductDTO[]> {
    const products = await this.productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .exec();

    return products.map((p) =>
      plainToInstance(ProductDTO, p.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /** 🔹 Tìm sản phẩm theo ID */
  async findById(id: string): Promise<ProductDTO | null> {
    const product = await this.productModel
      .findById(id)
      .populate('category_id', 'name')
      .exec();

    if (!product) return null;

    return plainToInstance(ProductDTO, product.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🔹 Tìm sản phẩm theo từ khóa (tên hoặc model) */
  async findByKeyword(keyword: string): Promise<ProductDTO[]> {
    const products = await this.productModel
      .find({
        is_delete: false,
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { model: { $regex: keyword, $options: 'i' } },
        ],
      })
      .populate('category_id', 'name')
      .exec();

    return products.map((p) =>
      plainToInstance(ProductDTO, p.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /** 🔹 Thêm sản phẩm mới */
  async create(productDTO: ProductDTO): Promise<Product> {
    const product = new this.productModel(productDTO);
    return product.save();
  }

  /** 🔹 Cập nhật sản phẩm */
  async update(productDTO: ProductDTO): Promise<Product> {
    const product = await this.productModel.findById(productDTO.id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(product, productDTO, { updated_at: new Date() });
    return product.save();
  }

  /** 🔹 Xóa mềm sản phẩm */
  async delete(id: string, updated_by: string): Promise<any> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.is_delete === true) {
      return { msg: 'Already deleted' };
    }

    product.is_delete = true;
    product.is_active = false;
    product.updated_at = new Date();
    product.updated_by = updated_by;

    await product.save();
    return { msg: 'Deleted (soft)' };
  }
}
