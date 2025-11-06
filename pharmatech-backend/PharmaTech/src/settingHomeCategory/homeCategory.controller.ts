import {
  Body,
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HomeCategoryService } from './homeCategory.service';
import { HomeCategoryDTO } from './homeCategory.dto';

@Controller('api/settings/home-categories')
export class HomeCategoryController {
  constructor(private readonly homeCategoryService: HomeCategoryService) {}

  // ✅ GET: lấy danh sách 3 category đang hiển thị ở trang home
  @Get()
  async getHomeCategories() {
    const result = await this.homeCategoryService.findHomeCategories();
    if (!result)
      throw new HttpException('No home categories found', HttpStatus.NOT_FOUND);
    return result;
  }

  // ✅ POST: lưu hoặc cập nhật 3 category
  @Post()
  async saveHomeCategories(@Body() dto: HomeCategoryDTO) {
    try {
      return await this.homeCategoryService.saveHomeCategories(dto);
    } catch (error) {
      throw new HttpException(
        'Failed to save home categories',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
