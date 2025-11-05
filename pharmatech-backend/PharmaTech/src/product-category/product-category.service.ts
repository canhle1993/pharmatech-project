import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductCategory } from './product-category.decorator';
import { Product } from '../product/product.decorator';
import { Category } from '../category/category.decorator';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly pcModel: Model<ProductCategory>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  /** 🔹 Thêm liên kết product-category */
  async add(product_id: string, category_id: string, updated_by = 'system') {
    try {
      const exists = await this.pcModel.findOne({
        product_id: new Types.ObjectId(product_id),
        category_id: new Types.ObjectId(category_id),
      });

      if (exists) return { ok: true, message: 'Already linked' };

      const doc = await this.pcModel.create({
        product_id: new Types.ObjectId(product_id),
        category_id: new Types.ObjectId(category_id),
        updated_by,
      });

      return doc;
    } catch (e) {
      throw new HttpException(
        'Failed to link product-category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** 🔹 Xóa liên kết product-category */
  async remove(product_id: string, category_id: string) {
    await this.pcModel.deleteOne({
      product_id: new Types.ObjectId(product_id),
      category_id: new Types.ObjectId(category_id),
    });
    return { ok: true };
  }

  /** 🔹 Lấy tất cả category của 1 product */
  async findCategoriesByProduct(product_id: string) {
    const links = await this.pcModel
      .find({ product_id: new Types.ObjectId(product_id) })
      .exec();

    const categoryIds = links.map((l) => l.category_id);

    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds }, is_delete: false })
      .exec();

    return categories;
  }

  /** 🔹 Lấy tất cả product của 1 category */
  async findProductsByCategory(category_id: string) {
    const links = await this.pcModel
      .find({ category_id: new Types.ObjectId(category_id) })
      .exec();

    const productIds = links.map((l) => l.product_id);

    const products = await this.productModel
      .find({ _id: { $in: productIds }, is_delete: false })
      .exec();

    return products;
  }
  /** 🔹 Cập nhật danh sách product của 1 category */
  async updateCategoryProducts(
    categoryId: string,
    productIds: string[],
    updated_by: string,
  ) {
    // Xóa tất cả liên kết cũ
    await this.pcModel.deleteMany({
      category_id: new Types.ObjectId(categoryId),
    });

    // Tạo lại các liên kết mới
    await Promise.all(
      productIds.map((pid) => this.add(pid, categoryId, updated_by)),
    );
  }
}
