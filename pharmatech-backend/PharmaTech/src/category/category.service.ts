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

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
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
      .sort({ created_at: -1 })
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
}
