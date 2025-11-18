import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './category.decorator';
import { Model } from 'mongoose';
import { CategoryDTO } from './category.dto';
import { plainToInstance } from 'class-transformer';
import { ProductCategoryService } from 'src/product-category/product-category.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,

    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /** 🔹 Lấy 1 category (kèm danh sách products thuộc category đó) */
  async findById(id: string): Promise<CategoryDTO | null> {
    // ✅ Tìm category theo ID
    const category = await this.categoryModel.findById(id).lean();
    if (!category) return null;

    // ✅ Populate danh sách sản phẩm thuộc category này
    const ProductModel = (this.categoryModel.db.models as any)['Product'];
    const products = await ProductModel.find({
      category_ids: { $in: [id] },
      is_delete: false,
    })
      .select('_id name model introduce price photo')
      .lean();

    // ✅ Convert sang DTO
    const dto = plainToInstance(CategoryDTO, category, {
      excludeExtraneousValues: true,
    });

    // ✅ Gán danh sách products vào DTO
    (dto as any).products = products.map((p: any) => ({
      id: p._id,
      name: p.name,
      model: p.model,
      introduce: p.introduce,
      price: p.price,
      photo: p.photo,
    }));

    // ✅ Gán thêm mảng id sản phẩm (để Angular tick MultiSelect)
    (dto as any).product_ids = products.map((p: any) => p._id.toString());

    return dto;
  }

  async findByKeyword(keyword: string): Promise<CategoryDTO[]> {
    const categories = await this.categoryModel
      .find({ name: { $regex: keyword, $options: 'i' } })
      .exec();

    return categories.map((c) =>
      plainToInstance(CategoryDTO, c.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findAll(): Promise<CategoryDTO[]> {
    const categories = await this.categoryModel
      .find({ is_delete: false })
      .sort({ updated_at: -1, created_at: -1 })
      .exec();

    return categories.map((c) =>
      plainToInstance(CategoryDTO, c.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  async create(categoryDTO: CategoryDTO): Promise<Category> {
    try {
      const category = new this.categoryModel({
        name: categoryDTO.name,
        description: categoryDTO.description,
        photo: categoryDTO.photo || null,
        is_active: true,
        is_delete: false,
        updated_by: categoryDTO.updated_by || 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      return await category.save();
    } catch (error) {
      // ✅ Kiểm tra trùng tên
      if (error.code === 11000) {
        throw new HttpException(
          `Category name "${categoryDTO.name}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }

      console.error('❌ Create Category error:', error);
      throw new HttpException(
        {
          message: 'Failed to create Category',
          errorMessage: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(categoryDTO: CategoryDTO): Promise<Category> {
    try {
      const updateData: any = {
        name: categoryDTO.name,
        description: categoryDTO.description,
        updated_by: categoryDTO.updated_by,
        updated_at: new Date(),
      };

      // ✅ Nếu có ảnh mới thì ghi đè
      if (categoryDTO.photo) {
        updateData.photo = categoryDTO.photo;
      }

      // ✅ Cập nhật và trả về document mới nhất
      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        categoryDTO.id,
        updateData,
        { new: true }, // ⚡ trả về doc sau khi cập nhật
      );

      if (!updatedCategory) {
        throw new HttpException('Category Not Found', HttpStatus.NOT_FOUND);
      }

      return updatedCategory;
    } catch (error) {
      // Nếu trùng tên thì báo lỗi 400
      if (error.code === 11000) {
        throw new HttpException(
          `Category name "${categoryDTO.name}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        { message: 'Failed to update category', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string, updated_by: string): Promise<any> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    if (category.is_delete === true) {
      return { msg: 'Already deleted' };
    }

    category.is_delete = true;
    category.is_active = false;
    category.updated_at = new Date();
    category.updated_by = updated_by;

    await category.save();
    return { msg: 'Deleted (soft)' };
  }

  async hardDelete(id: string) {
    // 1️⃣ Tìm category
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    // 2️⃣ Kiểm tra liên kết trong bảng product-category
    const ProductCategoryModel = (this.categoryModel.db.models as any)[
      'ProductCategory'
    ];

    const linkedCount = await ProductCategoryModel.countDocuments({
      category_id: id,
    });

    // 3️⃣ Nếu có liên kết product → KHÔNG cho xóa
    if (linkedCount > 0) {
      throw new HttpException(
        `Cannot permanently delete: This category is being used by ${linkedCount} products.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4️⃣ Không có liên kết → XÓA CỨNG
    await this.categoryModel.deleteOne({ _id: id });

    return { msg: 'Deleted permanently' };
  }

  // ===============================
  // 🔄 Khôi phục Category đã xóa mềm
  // ===============================
  async restore(id: string, updated_by: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    if (!category.is_delete) {
      return { msg: 'Category is already active' };
    }

    category.is_delete = false;
    category.is_active = true;
    category.updated_at = new Date();
    category.updated_by = updated_by || 'admin';

    await category.save();

    return { msg: 'Restored successfully', category };
  }

  /** 🗑️ Lấy danh sách Category đã xóa mềm */
  async findDeleted() {
    const cats = await this.categoryModel
      .find({ is_delete: true })
      .sort({ updated_at: -1 })
      .lean();

    // 👉 Lấy bảng trung gian ProductCategory
    const ProductCategoryModel = (this.categoryModel.db.models as any)[
      'ProductCategory'
    ];

    const result = [];

    for (const c of cats) {
      // 👉 Kiểm tra category có bị liên kết với sản phẩm không
      const prodCount = await ProductCategoryModel.countDocuments({
        category_id: c._id.toString(),
      });

      result.push({
        ...c,

        // 👉 Nếu category có ảnh thì trả URL đầy đủ
        photo: c.photo ? `${process.env.image_url}/${c.photo}` : null,

        // 👉 TRUE thì disable nút delete
        hasLink: prodCount > 0,

        // 👉 Cast _id to string cho FE
        id: c._id.toString(),
      });
    }

    return result;
  }
}
