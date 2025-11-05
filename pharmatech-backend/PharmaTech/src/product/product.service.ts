import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
<<<<<<< HEAD
import { plainToInstance } from 'class-transformer';
import { Product, ProductDocument } from './product.decorator';
import { ProductDTO } from './product.dto';
=======
import { Product } from './product.decorator';
import { ProductDTO } from './product.dto';
import { plainToInstance } from 'class-transformer';
import { ProductImage } from 'src/product-image/product-image.decorator';
import { ProductCategoryService } from 'src/product-category/product-category.service'; // ✅ Thêm import
>>>>>>> origin/main

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
<<<<<<< HEAD
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
=======
    private _productModel: Model<Product>,
    @InjectModel(ProductImage.name)
    private _productImageModel: Model<ProductImage>,

    /** ✅ Inject thêm ProductCategoryService để xử lý liên kết */
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /** 🔹 Lấy 1 sản phẩm (kèm ảnh phụ + categories chuẩn ID thật) */
  async findById(id: string): Promise<ProductDTO | null> {
    // ✅ Lấy product gốc + populate category_ids (đúng bảng Category)
    const product = await this._productModel
      .findById(id)
      .populate({
        path: 'category_ids',
        model: 'Category',
        select: '_id name',
      })
>>>>>>> origin/main
      .exec();

    if (!product) return null;

<<<<<<< HEAD
    return plainToInstance(ProductDTO, product.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🔹 Tìm sản phẩm theo từ khóa (tên hoặc model) */
  async findByKeyword(keyword: string): Promise<ProductDTO[]> {
    const products = await this.productModel
      .find({
        is_delete: false,
=======
    // 🔸 Lấy ảnh phụ (nếu có bảng product-image)
    const images = await this._productImageModel
      .find({ product_id: id })
      .sort({ created_at: -1 })
      .exec();

    // 🔸 Convert sang DTO
    const dto = plainToInstance(ProductDTO, product.toObject(), {
      excludeExtraneousValues: true,
    });

    // ✅ Gán gallery + categories
    (dto as any).gallery = images.map((img) => img.url);
    (dto as any).categories = (product as any).category_ids.map((c: any) => ({
      id: c._id,
      name: c.name,
    }));

    // ✅ Và quan trọng nhất: giữ lại category_ids là mảng ObjectId thật
    (dto as any).category_ids = (product as any).category_ids.map((c: any) =>
      c._id.toString(),
    );

    return dto;
  }

  /** 🔹 Lấy tất cả (kèm category_ids) */
  /** 🔹 Lấy tất cả (kèm category_ids + categories) */
  async findAll(): Promise<ProductDTO[]> {
    const products = await this._productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .lean();

    const ProductCategoryModel = (this._productModel.db.models as any)[
      'ProductCategory'
    ];
    const CategoryModel = (this._productModel.db.models as any)['Category'];

    for (const p of products) {
      const links = await ProductCategoryModel.find({
        product_id: p._id,
      }).lean();
      const categoryIds = links.map((l: any) => l.category_id?.toString()); // ✅ convert sang string

      const categories = await CategoryModel.find({
        _id: { $in: categoryIds },
      }).lean();

      (p as any).category_ids = categoryIds; // ✅ thêm dòng này để frontend lọc được
      (p as any).categories = categories.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
      }));
    }

    return products.map((p) =>
      plainToInstance(ProductDTO, p, { excludeExtraneousValues: true }),
    );
  }

  /** 🔹 Tìm theo keyword (theo name hoặc model) */
  async findByKeyword(keyword: string): Promise<ProductDTO[]> {
    const products = await this._productModel
      .find({
>>>>>>> origin/main
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { model: { $regex: keyword, $options: 'i' } },
        ],
<<<<<<< HEAD
      })
      .populate('category_id', 'name')
=======
        is_delete: false,
      })
>>>>>>> origin/main
      .exec();

    return products.map((p) =>
      plainToInstance(ProductDTO, p.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main

    product.is_delete = true;
    product.is_active = false;
    product.updated_at = new Date();
    product.updated_by = updated_by;

    await product.save();
    return { msg: 'Deleted (soft)' };
  }
<<<<<<< HEAD
=======

  /** 🔹 Lấy danh sách sản phẩm đang active */
  async findActive(): Promise<Product[]> {
    return this._productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 });
  }
>>>>>>> origin/main
}
