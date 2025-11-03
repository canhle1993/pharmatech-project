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

  async findById(id: string): Promise<CategoryDTO | null> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) return null;
    return plainToInstance(CategoryDTO, category.toObject(), {
      excludeExtraneousValues: true,
    });
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
    const category = await this.categoryModel.findById(categoryDTO.id);
    if (!category) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    Object.assign(category, categoryDTO, { updated_at: new Date() });
    return category.save();
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
