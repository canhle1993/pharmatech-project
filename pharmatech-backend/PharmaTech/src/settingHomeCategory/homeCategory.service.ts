import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HomeCategoryDTO } from './homeCategory.dto';

@Injectable()
export class HomeCategoryService {
  constructor(
    @InjectModel('HomeCategory')
    private readonly homeCategoryModel: Model<HomeCategoryDTO>,
  ) {}

  // 🔹 Lưu hoặc cập nhật 3 category cho trang home
  async saveHomeCategories(dto: HomeCategoryDTO) {
    const existing = await this.homeCategoryModel.findOne();
    if (existing) {
      existing.category1 = dto.category1;
      existing.category2 = dto.category2;
      existing.category3 = dto.category3;
      return await existing.save();
    }
    return await this.homeCategoryModel.create(dto);
  }

  // 🔹 Lấy danh sách 3 category hiện tại
  async findHomeCategories() {
    return await this.homeCategoryModel
      .findOne()
      .populate('category1')
      .populate('category2')
      .populate('category3')
      .exec();
  }
}
