import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryDTO } from './category.dto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { v4 as uuidv4 } from 'uuid';
<<<<<<< HEAD

@Controller('api/category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    let categoryDTO = await this.categoryService.findById(id);
    if (categoryDTO == null) {
      throw new HttpException('Id Not Found', HttpStatus.NOT_FOUND);
    } else {
      return categoryDTO;
    }
  }

=======
import { ProductCategoryService } from 'src/product-category/product-category.service';

@Controller('api/category')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private productCategoryService: ProductCategoryService,
  ) {}

  // 🔹 Lấy theo ID
  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const categoryDTO = await this.categoryService.findById(id);
    if (!categoryDTO) {
      throw new HttpException('Id Not Found', HttpStatus.NOT_FOUND);
    }
    return categoryDTO;
  }

  // 🔹 Tìm theo keyword
>>>>>>> origin/main
  @Get('find-by-keyword/:keyword')
  findByKeyword(@Param('keyword') keyword: string) {
    return this.categoryService.findByKeyword(keyword);
  }

<<<<<<< HEAD
=======
  // 🔹 Lấy toàn bộ
>>>>>>> origin/main
  @Get('find-all')
  findAll() {
    return this.categoryService.findAll();
  }

<<<<<<< HEAD
  @Post('create')
  async create(@Body() categoryDTO: CategoryDTO) {
    return await this.categoryService.create(categoryDTO);
  }

  @Put('update')
  async update(@Body() categoryDTO: CategoryDTO) {
    return await this.categoryService.update(categoryDTO);
  }

  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.categoryService.delete(id, updated_by);
  }

  @Post('upload')
=======
  // ✅ Tạo Category + liên kết Product
  @Post('create')
>>>>>>> origin/main
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4().replace(/-/g, '');
          const extension = extname(file.originalname);
          cb(null, uniqueName + extension);
        },
      }),
    }),
  )
<<<<<<< HEAD
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: 'http://localhost:3000/upload/' + file.filename,
    };
=======
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    try {
      // 1️⃣ Chuẩn hóa dữ liệu
      const categoryDTO: CategoryDTO = {
        name: body.name,
        description: body.description,
        updated_by: body.updated_by,
        photo: file ? file.filename : null,
      } as CategoryDTO;

      // ✅ Đúng
      // ✅ ép kiểu any để có thể truy cập _id
      const createdCategory: any =
        await this.categoryService.create(categoryDTO);

      if (body.product_ids) {
        const productIds: string[] = Array.isArray(body.product_ids)
          ? body.product_ids
          : JSON.parse(body.product_ids);

        await Promise.all(
          productIds.map((pid) =>
            this.productCategoryService.add(
              pid,
              createdCategory._id.toString(),
              categoryDTO.updated_by || 'admin',
            ),
          ),
        );
      }

      return {
        message: 'Category created successfully',
        data: createdCategory,
      };
    } catch (error) {
      console.error('❌ Create category error:', error);
      throw new HttpException(
        {
          message: 'Failed to create category',
          errorMessage: error.message,
          errorStack: error.stack,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ✅ Cập nhật Category + cập nhật product liên kết
  @Put('update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4().replace(/-/g, '');
          const extension = extname(file.originalname);
          cb(null, uniqueName + extension);
        },
      }),
    }),
  )
  async update(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    try {
      const categoryDTO: CategoryDTO = {
        id: body.id,
        name: body.name,
        description: body.description,
        updated_by: body.updated_by,
        photo: file ? file.filename : null,
      } as CategoryDTO;

      // Cập nhật thông tin chính
      const updatedCategory = await this.categoryService.update(categoryDTO);

      // Chuẩn hóa productIds nếu có
      if (body.product_ids) {
        const productIds: string[] = Array.isArray(body.product_ids)
          ? body.product_ids
          : JSON.parse(body.product_ids);

        // 🔑 Lấy categoryId an toàn (ưu tiên body.id)
        const uc: any = updatedCategory as any;
        const categoryId =
          body.id || uc?.id || (uc?._id ? uc._id.toString() : undefined);

        if (!categoryId) {
          throw new HttpException(
            'Cannot resolve category id after update',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.productCategoryService.updateCategoryProducts(
          categoryId,
          productIds,
          categoryDTO.updated_by || 'admin',
        );
      }

      return {
        message: 'Category updated successfully',
        data: updatedCategory,
      };
    } catch (error) {
      console.error('❌ Update category error:', error);
      throw new HttpException(
        {
          message: 'Failed to update category',
          errorMessage: error.message,
          errorStack: error.stack,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 Xóa mềm
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.categoryService.delete(id, updated_by);
>>>>>>> origin/main
  }
}
