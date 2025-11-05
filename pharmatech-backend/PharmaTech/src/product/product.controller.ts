import {
  Body,
  Controller,
  Get,
<<<<<<< HEAD
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDTO } from './product.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
=======
  Post,
  Put,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDTO } from './product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
>>>>>>> origin/main

@Controller('api/product')
export class ProductController {
  constructor(private productService: ProductService) {}

<<<<<<< HEAD
  /** 🔹 Lấy tất cả sản phẩm */
  @Get('find-all')
  async findAll() {
    return this.productService.findAll();
  }

  /** 🔹 Tìm sản phẩm theo ID */
  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const productDTO = await this.productService.findById(id);
    if (!productDTO) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return productDTO;
  }

  /** 🔹 Tìm sản phẩm theo từ khóa (tên hoặc model) */
  @Get('find-by-keyword/:keyword')
  async findByKeyword(@Param('keyword') keyword: string) {
    return await this.productService.findByKeyword(keyword);
  }

  /** 🔹 Thêm sản phẩm mới */
  @Post('create')
  async create(@Body() productDTO: ProductDTO) {
    return await this.productService.create(productDTO);
  }

  /** 🔹 Cập nhật sản phẩm */
  @Put('update')
  async update(@Body() productDTO: ProductDTO) {
    return await this.productService.update(productDTO);
  }

  /** 🔹 Xóa mềm sản phẩm */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.productService.delete(id, updated_by);
  }

  @Post('upload')
=======
  /** 🔹 Lấy theo ID (kèm ảnh phụ + categories) */
  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const productDTO = await this.productService.findById(id);
    if (!productDTO)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    return productDTO;
  }

  /** 🔹 Tìm theo keyword */
  @Get('find-by-keyword/:keyword')
  findByKeyword(@Param('keyword') keyword: string) {
    return this.productService.findByKeyword(keyword);
  }

  /** 🔹 Lấy tất cả */
  @Get('find-all')
  findAll() {
    return this.productService.findAll();
  }

  /** ✅ Tạo Product có upload ảnh và category_ids */
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
      const dto: ProductDTO = {
        name: body.name,
        model: body.model,
        manufacturer: body.manufacturer,
        description: body.description,
        specification: body.specification,
        price: body.price ? Number(body.price) : 0,
        updated_by: body.updated_by || 'admin',
        photo: file ? file.filename : null,

        /** ✅ parse category_ids (nếu frontend gửi chuỗi JSON) */
        category_ids:
          typeof body.category_ids === 'string'
            ? JSON.parse(body.category_ids)
            : body.category_ids,
      } as any;

      const created = await this.productService.create(dto);

      return { message: '✅ Product created successfully', data: created };
    } catch (error) {
      console.error('❌ Create product error:', error);
      throw new HttpException(
        { message: 'Failed to create product', errorMessage: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ✅ Cập nhật Product (có thể đổi category_ids và ảnh mới) */
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
      const dto: ProductDTO = {
        id: body.id,
        name: body.name,
        model: body.model,
        manufacturer: body.manufacturer,
        description: body.description,
        specification: body.specification,
        price: body.price ? Number(body.price) : 0,
        updated_by: body.updated_by || 'admin',
        photo: file ? file.filename : null,

        /** ✅ parse category_ids khi update */
        category_ids:
          typeof body.category_ids === 'string'
            ? JSON.parse(body.category_ids)
            : body.category_ids,
      } as any;

      const updated = await this.productService.update(dto);
      return { message: '✅ Product updated successfully', data: updated };
    } catch (error) {
      console.error('❌ Update product error:', error);
      throw new HttpException(
        { message: 'Failed to update product', errorMessage: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Xóa mềm */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.productService.softDelete(id, updated_by);
  }

  /** 🔹 Lấy sản phẩm đang active */
  @Get('find-active')
  async findActive() {
    return this.productService.findActive();
>>>>>>> origin/main
  }
}
