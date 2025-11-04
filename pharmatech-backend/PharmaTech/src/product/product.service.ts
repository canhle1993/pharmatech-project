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
import { ProductCategoryService } from 'src/product-category/product-category.service'; // ✅ Thêm import

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private _productModel: Model<Product>,
    @InjectModel(ProductImage.name)
    private _productImageModel: Model<ProductImage>,

    /** ✅ Inject thêm ProductCategoryService để xử lý liên kết */
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /** 🔹 Lấy 1 sản phẩm (kèm ảnh phụ + categories) */
  async findById(id: string): Promise<ProductDTO | null> {
    const product = await this._productModel.findById(id).exec();
    if (!product) return null;

    // 🔸 Lấy ảnh phụ
    const images = await this._productImageModel
      .find({ product_id: id })
      .sort({ created_at: -1 })
      .exec();

    // 🔸 Lấy categories từ bảng product_categories
    const categories =
      await this.productCategoryService.findCategoriesByProduct(id);

    // 🔸 Convert sang DTO
    const dto = plainToInstance(ProductDTO, product.toObject(), {
      excludeExtraneousValues: true,
    });

    // 🔸 Thêm các trường mở rộng
    (dto as any).gallery = images.map((img) => img.url);
    (dto as any).categories = categories;

    return dto;
  }

  /** 🔹 Lấy tất cả (kèm category_ids) */
  async findAll(): Promise<ProductDTO[]> {
    const products = await this._productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .lean();

    // ✅ Lấy liên kết từ bảng product-category
    const ProductCategoryModel = (this._productModel.db.models as any)[
      'ProductCategory'
    ];
    const CategoryModel = (this._productModel.db.models as any)['Category'];

    for (const p of products) {
      const links = await ProductCategoryModel.find({
        product_id: p._id,
      }).lean();
      const categoryIds = links.map((l: any) => l.category_id);
      const categories = await CategoryModel.find({
        _id: { $in: categoryIds },
      }).lean();
      (p as any).categories = categories.map((c: any) => ({
        id: c._id,
        name: c.name,
      }));
    }

    return products.map((p) =>
      plainToInstance(ProductDTO, p, {
        excludeExtraneousValues: true,
      }),
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

  /** 🔹 Tạo Product mới (kèm category_ids) */
  async create(productDTO: ProductDTO): Promise<Product> {
    try {
      const product = new this._productModel({
        name: productDTO.name,
        model: productDTO.model,
        description: productDTO.description,
        specification: productDTO.specification,
        price: productDTO.price,
        manufacturer: productDTO.manufacturer,
        photo: productDTO.photo || null,
        category_ids: productDTO.category_ids || [], // ✅ thêm
        is_active: true,
        is_delete: false,
        updated_by: productDTO.updated_by || 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const created = await product.save();

      // ✅ Sau khi tạo product -> lưu liên kết vào bảng product_categories
      if (productDTO.category_ids && productDTO.category_ids.length > 0) {
        for (const cid of productDTO.category_ids) {
          await this.productCategoryService.add(
            created._id.toString(),
            cid,
            productDTO.updated_by,
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

  /** 🔹 Cập nhật Product (kèm cập nhật danh mục) */
  async update(productDTO: ProductDTO): Promise<Product> {
    try {
      const updateData: any = {
        name: productDTO.name,
        model: productDTO.model,
        manufacturer: productDTO.manufacturer,
        description: productDTO.description,
        specification: productDTO.specification,
        price: productDTO.price,
        updated_by: productDTO.updated_by,
        updated_at: new Date(),
      };

      if (productDTO.photo) updateData.photo = productDTO.photo;
      if (productDTO.category_ids)
        updateData.category_ids = productDTO.category_ids; // ✅ thêm

      const updatedProduct = await this._productModel.findByIdAndUpdate(
        productDTO.id,
        updateData,
        { new: true },
      );

      if (!updatedProduct) {
        throw new NotFoundException('Product not found');
      }

      // ✅ Cập nhật lại liên kết product-category
      if (productDTO.category_ids && productDTO.category_ids.length > 0) {
        await this.productCategoryService.updateCategoryProducts(
          productDTO.category_ids ? productDTO.category_ids[0] : '',
          productDTO.category_ids,
          productDTO.updated_by || 'admin',
        );
      }

      return updatedProduct;
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
}
