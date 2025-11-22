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
import { OrderDetails } from 'src/order-details/order-details.decorator';
import { Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { ImportProductDTO } from './import-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private _productModel: Model<Product>,
    @InjectModel(ProductImage.name)
    private _productImageModel: Model<ProductImage>,
    private readonly productCategoryService: ProductCategoryService,
    @InjectModel(OrderDetails.name)
    private orderDetailsModel: Model<OrderDetails>,
  ) {}

  /** ⭐ Lấy sản phẩm liên quan cùng category */
  async getRelatedProducts(productId: string) {
    // ============================
    // 1) Lấy category_ids của sản phẩm hiện tại
    // ============================
    const ProductCategoryModel = (this._productModel.db.models as any)[
      'ProductCategory'
    ];
    const CategoryModel = (this._productModel.db.models as any)['Category'];

    // lấy liên kết của product hiện tại
    const currentLinks = await ProductCategoryModel.find({
      product_id: productId,
    }).lean();

    if (currentLinks.length === 0) return [];

    const categoryIds = currentLinks.map((l: any) => l.category_id?.toString());

    // ============================
    // 2) Lấy danh sách sản phẩm khác trong các category này
    // ============================
    const otherLinks = await ProductCategoryModel.find({
      category_id: { $in: categoryIds },
      product_id: { $ne: productId }, // loại bỏ chính nó
    }).lean();

    const relatedProductIds = [
      ...new Set(otherLinks.map((l: any) => l.product_id?.toString())),
    ];

    if (relatedProductIds.length === 0) return [];

    // ============================
    // 3) Lấy thông tin product tương ứng
    // ============================
    const products = await this._productModel
      .find({
        _id: { $in: relatedProductIds },
        is_delete: false,
      })
      .sort({ updated_at: -1 })
      .lean();

    // ============================
    // 4) Build DTO
    // ============================
    return products.map((p) =>
      plainToInstance(ProductDTO, p, { excludeExtraneousValues: true }),
    );
  }

  /** 🔹 Lấy 1 sản phẩm (kèm ảnh phụ + categories) */
  async findById(id: string): Promise<ProductDTO | null> {
    const product = await this._productModel.findById(id).lean(); // ⚡ dùng lean() cho dễ xử lý
    if (!product) return null;

    // ======================
    // ⭐ LOAD IMAGES
    // ======================
    const images = await this._productImageModel
      .find({ product_id: id })
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    // ======================
    // ⭐ LOAD CATEGORIES TỪ BẢNG TRUNG GIAN (giống findAll)
    // ======================
    const ProductCategoryModel = (this._productModel.db.models as any)[
      'ProductCategory'
    ];
    const CategoryModel = (this._productModel.db.models as any)['Category'];

    const links = await ProductCategoryModel.find({ product_id: id }).lean();

    let categories = [];
    let category_ids = [];

    if (links.length > 0) {
      category_ids = links.map((l: any) => l.category_id?.toString());

      const cats = await CategoryModel.find({
        _id: { $in: category_ids },
        is_delete: false,
      })
        .select('_id name')
        .lean();

      categories = cats.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
      }));
    }

    // ======================
    // ⭐ BUILD DTO
    // ======================
    const dto = plainToInstance(ProductDTO, product, {
      excludeExtraneousValues: true,
    });

    (dto as any).gallery = images.map((img) => img.url);
    (dto as any).categories = categories; // ⭐ ĐÃ SỬA — GIỜ ĐÚNG 2 CATEGORY
    (dto as any).category_ids = category_ids;

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

  async getTopSelling() {
    const results = await this.orderDetailsModel.aggregate([
      {
        $match: {
          status: 'Delivered',
          is_delete: false,
        },
      },

      // 👉 Convert product_id (string) → ObjectId
      {
        $addFields: {
          productObjId: { $toObjectId: '$product_id' },
        },
      },

      {
        $group: {
          _id: '$productObjId',
          totalSold: { $sum: '$quantity' },
        },
      },

      { $sort: { totalSold: -1 } },
      { $limit: 3 },

      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },

      { $unwind: '$product' },
      // 👇 CHỈ LẤY SẢN PHẨM CHƯA BỊ XÓA
      {
        $match: {
          'product.is_delete': false,
        },
      },

      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: '$product.name',
          model: '$product.model',
          photo: '$product.photo',
          price: '$product.price',
          totalSold: 1,
        },
      },
    ]);

    return results;
  }

  // ================================
  // 🆕 Lấy 4 sản phẩm mới nhất
  // ================================
  async findNewest(limit = 4) {
    return await this._productModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
  }

  // ================================
  // 🏆 Lấy sản phẩm bán chạy nhất (Top 1)
  // ================================
  async findTopOneSelling() {
    const results = await this.orderDetailsModel.aggregate([
      {
        $match: {
          status: 'Delivered',
          is_delete: false,
        },
      },

      // 👇 convert product_id (string) -> ObjectId GIỐNG getTopSelling
      {
        $addFields: {
          productObjId: { $toObjectId: '$product_id' },
        },
      },

      {
        $group: {
          _id: '$productObjId',
          totalSold: { $sum: '$quantity' },
        },
      },

      { $sort: { totalSold: -1 } },
      { $limit: 1 }, // 👈 chỉ lấy 1 sản phẩm

      {
        $lookup: {
          from: 'products', // 👈 đúng tên collection
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },

      { $unwind: '$product' },
      // 👇 filter product đã bị xóa
      {
        $match: {
          'product.is_delete': false,
        },
      },

      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: '$product.name',
          model: '$product.model',
          photo: '$product.photo',
          price: '$product.price',
          totalSold: 1,
        },
      },
    ]);

    return results[0] || null;
  }

  /** ❌ XÓA CỨNG — chỉ xóa khi KHÔNG nằm trong OrderDetails */
  async hardDelete(id: string) {
    // 1) Kiểm tra product có tồn tại không
    const product = await this._productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2) Kiểm tra product này có xuất hiện trong OrderDetails không
    const usedInOrders = await this.orderDetailsModel.countDocuments({
      product_id: id,
    });

    if (usedInOrders > 0) {
      throw new HttpException(
        `Cannot delete: this product is used in ${usedInOrders} order(s).`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3) Không có đơn hàng → Xóa thật
    await this._productModel.deleteOne({ _id: id });

    return { msg: 'Product permanently deleted' };
  }

  /** ♻️ Restore product đã bị xóa mềm */
  async restore(id: string, updated_by: string) {
    const product = await this._productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Nếu product chưa bị xóa mềm
    if (product.is_delete === false) {
      return { msg: 'Product is already active' };
    }

    // Khôi phục
    product.is_delete = false;
    product.is_active = true;
    product.updated_at = new Date();
    product.updated_by = updated_by || 'admin';

    await product.save();

    return { msg: 'Product restored successfully' };
  }

  /** 🗑️ Lấy danh sách sản phẩm đã xóa mềm */
  /** 🗑️ Lấy danh sách sản phẩm đã xóa mềm */
  async findDeleted() {
    const products = await this._productModel
      .find({ is_delete: true })
      .sort({ updated_at: -1 })
      .lean();

    const result = [];
    for (const p of products) {
      const orderCount = await this.orderDetailsModel.countDocuments({
        product_id: p._id,
      });

      result.push({
        ...p,
        photo: p.photo ? `${process.env.image_url}/${p.photo}` : null, // ⭐ FIX QUAN TRỌNG
        hasLink: orderCount > 0,
      });
    }

    return result;
  }

  async importFromExcel(file: Express.Multer.File) {
    try {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      let total = worksheet.length;
      let success = 0;
      let failed = 0;
      let errors = [];

      for (let i = 0; i < worksheet.length; i++) {
        const row: any = worksheet[i];

        const name = row.name?.toString().trim();
        const model = row.model?.toString().trim() || '';
        const price = Number(row.price) || 0;
        const introduce = row.introduce || '';
        const description = row.description || '';
        const specification = row.specification || '';
        const stock_quantity = Number(row.stock_quantity) || 0;

        // ❗ Kiểm tra tên trống
        if (!name) {
          failed++;
          errors.push({ row: i + 2, reason: 'Missing product name' });
          continue;
        }

        // ❗ Kiểm tra trùng tên
        const existName = await this._productModel.findOne({
          name,
          is_delete: false,
        });

        if (existName) {
          failed++;
          errors.push({
            row: i + 2,
            reason: `Duplicate product name "${name}"`,
          });
          continue;
        }

        // ❗ KHÔNG XỬ LÝ CATEGORY — LUÔN ĐỂ TRỐNG
        const dto: ImportProductDTO = {
          name,
          model,
          price,
          introduce,
          description,
          specification,
          updated_by: 'admin',
          photo: null,
          stock_quantity,
          stock_status: stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
          category_ids: [], // luôn rỗng
        };

        try {
          await this.create(dto as ProductDTO);
          success++;
        } catch (err) {
          failed++;
          errors.push({
            row: i + 2,
            reason: err.message || 'Failed to create product',
          });
        }
      }

      return {
        total,
        success,
        failed,
        errors,
      };
    } catch (err) {
      throw new HttpException(
        { message: 'Import failed', error: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 📤 EXPORT EXCEL — Xuất toàn bộ sản phẩm */
  async exportToExcel() {
    // 1) Lấy tất cả sản phẩm
    const products = await this.findAll(); // đã có categories sẵn

    // 2) Chuyển sang dữ liệu Excel
    const exportData = products.map((p) => ({
      Name: p.name,
      Model: p.model,
      Category: p.categories?.map((c) => c.name).join(', ') || '',
      Price: p.price,
      Quantity: p.stock_quantity,
      Status: p.stock_status,
      CreatedAt: p.created_at,
    }));

    // 3) Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 4) Tạo workbook
    const workbook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };

    // 5) Xuất file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    return excelBuffer;
  }

  // 🆕 CHECK STOCK
  async checkStock(productId: string) {
    const product = await this._productModel.findById(productId).lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ok: product.stock_quantity > 0,
      product_id: productId,
      stock_quantity: product.stock_quantity || 0,
      message: product.stock_quantity > 0 ? 'In stock' : 'Out of stock',
    };
  }
}
