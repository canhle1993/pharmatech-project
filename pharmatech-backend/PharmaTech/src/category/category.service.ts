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
    let categories = await this.categoryModel
      .find({
        name: { $regex: keyword, $options: 'i' }, // chỗ này options phải là string, không phải mảng
      })
      .exec();
    return categories.map((c) =>
      plainToInstance(CategoryDTO, c.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findAll(): Promise<CategoryDTO[]> {
    // 🔹 Lọc chỉ lấy các category chưa bị xóa
    const categories = await this.categoryModel
      .find({ is_delete: false }) // chỉ lấy dữ liệu chưa xóa mềm
      .sort({ created_at: -1 }) // sắp xếp mới nhất lên đầu
      .exec();

    // 🔹 Chuyển sang DTO
    return categories.map((c) =>
      plainToInstance(CategoryDTO, c.toObject(), {
        excludeExtraneousValues: true,
      }),
    );
  }

  create(categoryDTO: CategoryDTO): Promise<Category> {
    let category = new this.categoryModel(categoryDTO);
    return category.save();
  }

  async update(categoryDTO: CategoryDTO): Promise<Category> {
    const category = await this.categoryModel.findById(categoryDTO.id);
    if (!category) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    } else {
      Object.assign(category, categoryDTO, {
        updated_at: new Date(),
      });
      return category.save();
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
    category.updated_by = updated_by; // ✅ nhận từ controller

    await category.save();
    return { msg: 'Deleted (soft)' };
  }
}
