import { Controller, Post, Delete, Body, Get, Param } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryDTO } from './product-category.dto';

@Controller('api/product-category')
export class ProductCategoryController {
  constructor(private readonly pcService: ProductCategoryService) {}

  /** 🔹 Liên kết product và category */
  @Post('add')
  add(@Body() dto: ProductCategoryDTO) {
    return this.pcService.add(dto.product_id, dto.category_id, dto.updated_by);
  }

  /** 🔹 Hủy liên kết product và category */
  @Delete('remove')
  remove(@Body() dto: ProductCategoryDTO) {
    return this.pcService.remove(dto.product_id, dto.category_id);
  }

  /** 🔹 Lấy danh sách category theo product */
  @Get('find-categories-by-product/:id')
  findCategoriesByProduct(@Param('id') id: string) {
    return this.pcService.findCategoriesByProduct(id);
  }

  /** 🔹 Lấy danh sách product theo category */
  @Get('find-products-by-category/:id')
  findProductsByCategory(@Param('id') id: string) {
    return this.pcService.findProductsByCategory(id);
  }
}
