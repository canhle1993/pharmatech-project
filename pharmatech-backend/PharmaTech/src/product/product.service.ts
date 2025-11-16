import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './product.decorator';
import { ProductDTO } from './product.dto';
import { plainToInstance } from 'class-transformer';
import { ProductImage } from 'src/product-image/product-image.decorator';
import { ProductCategoryService } from 'src/product-category/product-category.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private _productModel: Model<Product>,
    @InjectModel(ProductImage.name)
    private _productImageModel: Model<ProductImage>,
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /** 🔹 Lấy 1 sản phẩm (kèm ảnh phụ + categories) */
  async findById(id: string): Promise<ProductDTO | null> {
    const product = await this._productModel
      .findById(id)
      .populate({
        path: 'category_ids',
        model: 'Category',
        select: '_id name',
      })
      .exec();

    if (!product) return null;

    const images = await this._productImageModel
      .find({ product_id: id })
      .sort({ updated_at: -1, created_at: -1 })
      .exec();

    const dto = plainToInstance(ProductDTO, product.toObject(), {
      excludeExtraneousValues: true,
    });

    (dto as any).gallery = images.map((img) => img.url);
    (dto as any).categories = (product as any).category_ids.map((c: any) => ({
      id: c._id,
      name: c.name,
    }));
    (dto as any).category_ids = (product as any).category_ids.map((c: any) =>
      c._id.toString(),
    );

    return dto;
  }

  /** 🔹 Lấy tất cả (kèm category_ids + categories) */
  async findAll(): Promise<ProductDTO[]> {
    const products = await this._productModel
      .find({ is_delete: false })
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    // Dùng đúng bảng trung gian để populate category
    const ProductCategoryModel = (this._productModel.db.models as any)[
      'ProductCategory'
    ];
    const CategoryModel = (this._productModel.db.models as any)['Category'];

    for (const p of products) {
      // 🔹 Lấy tất cả category_id có trong bảng trung gian theo product_id
      const links = await ProductCategoryModel.find({
        product_id: p._id,
      }).lean();

      if (links.length > 0) {
        const categoryIds = links.map((l: any) => l.category_id?.toString());
        const categories = await CategoryModel.find({
          _id: { $in: categoryIds },
          is_delete: false,
        })
          .select('_id name')
          .lean();

        (p as any).category_ids = categoryIds;
        (p as any).categories = categories.map((c: any) => ({
          id: c._id.toString(),
          name: c.name,
        }));
      } else {
        (p as any).category_ids = [];
        (p as any).categories = [];
      }
    }

    return products.map((p) =>
      plainToInstance(ProductDTO, p, { excludeExtraneousValues: true }),
    );
  }

  /** 🔹 Tìm theo keyword (theo name hoặc model) */
  async findByKeyword(keyword: string): Promise<ProductDTO[]> {
    const products = await this._productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { model: { $regex: keyword, $options: 'i' } },
        ],
        is_delete: false,
      })
      .exec();

    return products.map((p) =>
      plainToInstance(ProductDTO, p.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /** 🔹 Tạo Product mới (tự tính trạng thái tồn kho + thêm vào bảng product-category) */
  async create(productDTO: ProductDTO): Promise<Product> {
    try {
      const stockQty = productDTO.stock_quantity ?? 0;
      const stockStatus = stockQty > 0 ? 'in_stock' : 'out_of_stock';

      const product = new this._productModel({
        name: productDTO.name,
        model: productDTO.model,
        description: productDTO.description,
        specification: productDTO.specification,
        price: productDTO.price,
        introduce: productDTO.introduce,
        photo: productDTO.photo || null,
        category_ids: productDTO.category_ids || [],
        stock_quantity: stockQty,
        stock_status: stockStatus,
        is_active: true,
        is_delete: false,
        updated_by: productDTO.updated_by || 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const created = await product.save();

      /** ✅ Bước thêm bản ghi vào bảng product-categories */
      if (productDTO.category_ids && productDTO.category_ids.length > 0) {
        for (const cid of productDTO.category_ids) {
          const catId = cid.toString?.() || cid; // đảm bảo là string
          await this.productCategoryService.add(
            created._id.toString(),
            catId,
            productDTO.updated_by || 'admin',
          );
        }
      }

      return created;
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          `Product name "${productDTO.name}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { message: 'Failed to create product', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Cập nhật Product (tự động tính lại trạng thái tồn kho + cập nhật liên kết category) */
  async update(productDTO: ProductDTO): Promise<ProductDTO> {
    try {
      const updateData: any = {
        name: productDTO.name,
        model: productDTO.model,
        introduce: productDTO.introduce,
        description: productDTO.description,
        specification: productDTO.specification,
        price: productDTO.price,
        updated_by: productDTO.updated_by,
        updated_at: new Date(),
      };

      if (productDTO.stock_quantity !== undefined) {
        updateData.stock_quantity = productDTO.stock_quantity;
        updateData.stock_status =
          productDTO.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
      }

      if (productDTO.photo) updateData.photo = productDTO.photo;
      if (productDTO.category_ids)
        updateData.category_ids = productDTO.category_ids;

      const updatedProduct = await this._productModel.findByIdAndUpdate(
        productDTO.id,
        updateData,
        { new: true },
      );

      if (!updatedProduct) {
        throw new NotFoundException('Product not found');
      }

      const newCategoryIds = (productDTO.category_ids || []).map(
        (c) => c.toString?.() || c,
      );
      await this.productCategoryService.updateCategoryProducts(
        productDTO.id,
        newCategoryIds,
        productDTO.updated_by || 'admin',
      );

      return await this.findById(productDTO.id);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          `Product name "${productDTO.name}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { message: 'Failed to update product', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Xóa mềm */
  async softDelete(id: string, updated_by: string): Promise<any> {
    const product = await this._productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    if (product.is_delete === true) return { msg: 'Already deleted' };

    product.is_delete = true;
    product.is_active = false;
    product.updated_at = new Date();
    product.updated_by = updated_by;

    await product.save();
    return { msg: 'Deleted (soft)' };
  }

  /** 🔹 Lấy danh sách sản phẩm đang active */
  async findActive(): Promise<Product[]> {
    return this._productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 });
  }

  /** 📉 Giảm số lượng tồn kho sau khi đặt hàng */
  async reduceStock(productId: string, quantity: number) {
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newQty = (product.stock_quantity || 0) - quantity;

    if (newQty < 0) {
      throw new HttpException('Not enough stock', HttpStatus.BAD_REQUEST);
    }

    product.stock_quantity = newQty;
    product.stock_status = newQty > 0 ? 'in_stock' : 'out_of_stock';
    product.updated_at = new Date();

    await product.save();

    return {
      msg: 'Stock reduced successfully',
      remaining: newQty,
    };
  }

  /** 📈 Tăng số lượng tồn kho khi hủy đơn */
  async increaseStock(productId: string, quantity: number) {
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.stock_quantity = (product.stock_quantity || 0) + quantity;
    product.stock_status =
      product.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
    product.updated_at = new Date();

    await product.save();

    return {
      msg: 'Stock increased successfully',
      remaining: product.stock_quantity,
    };
  }

  /** 🟩 Cập nhật tồn kho: cộng thêm số lượng mới */
  async updateStock(
    productId: string,
    added_quantity: number,
    updated_by?: string,
  ) {
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newQty = (product.stock_quantity || 0) + added_quantity;

    product.stock_quantity = newQty;
    product.stock_status = newQty > 0 ? 'in_stock' : 'out_of_stock';
    product.updated_at = new Date();
    product.updated_by = updated_by || 'admin';

    await product.save();

    return {
      msg: 'Stock updated successfully',
      new_quantity: newQty,
    };
  }

  async getProductsInStock() {
    const list = await this._productModel
      .find({ stock_quantity: { $gt: 0 }, is_delete: false })
      .sort({ updated_at: -1 });

    return plainToInstance(ProductDTO, list, { excludeExtraneousValues: true });
  }

  async getProductsOutOfStock() {
    const list = await this._productModel
      .find({ stock_quantity: 0, is_delete: false })
      .sort({ updated_at: -1 });

    return plainToInstance(ProductDTO, list, { excludeExtraneousValues: true });
  }
}
