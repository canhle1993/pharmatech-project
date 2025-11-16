import {
  Body,
  Controller,
  Get,
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

@Controller('api/product')
export class ProductController {
  constructor(private productService: ProductService) {}

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
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    try {
      const dto: ProductDTO = {
        name: body.name,
        model: body.model,
        introduce: body.introduce,
        description: body.description,
        specification: body.specification,
        price: body.price ? Number(body.price) : 0,
        updated_by: body.updated_by || 'admin',
        photo: file ? file.filename : null,

        /** ✅ Thêm quản lý tồn kho */
        stock_quantity: body.stock_quantity ? Number(body.stock_quantity) : 0,
        stock_status: body.stock_status || 'in_stock',

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

  /** ✅ Cập nhật Product (có thể đổi category_ids, ảnh và tồn kho) */
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
        introduce: body.introduce,
        description: body.description,
        specification: body.specification,
        price: body.price ? Number(body.price) : 0,
        updated_by: body.updated_by || 'admin',
        photo: file ? file.filename : null,

        /** ✅ Thêm quản lý tồn kho */
        stock_quantity: body.stock_quantity ? Number(body.stock_quantity) : 0,
        stock_status: body.stock_status || 'in_stock',

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
  }

  /** 📉 Giảm tồn kho sản phẩm */
  @Put('reduce-stock/:id')
  async reduceStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (!quantity || quantity <= 0) {
      throw new HttpException('Invalid quantity', HttpStatus.BAD_REQUEST);
    }

    return await this.productService.reduceStock(id, quantity);
  }

  @Put('increase-stock/:id')
  async increaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (!quantity || quantity <= 0) {
      throw new HttpException('Invalid quantity', HttpStatus.BAD_REQUEST);
    }

    return await this.productService.increaseStock(id, quantity);
  }

  /** 🟩 Cập nhật tồn kho: thêm số lượng mới */
  @Put('update-stock/:id')
  async updateStock(
    @Param('id') id: string,
    @Body('added_quantity') added_quantity: number,
    @Body('updated_by') updated_by: string,
  ) {
    if (!added_quantity || added_quantity <= 0) {
      throw new HttpException('Invalid added quantity', HttpStatus.BAD_REQUEST);
    }

    return await this.productService.updateStock(
      id,
      added_quantity,
      updated_by || 'admin',
    );
  }

  @Get('stock/in-stock')
  async getProductsInStock() {
    return this.productService.getProductsInStock();
  }

  @Get('stock/out-of-stock')
  async getProductsOutOfStock() {
    return this.productService.getProductsOutOfStock();
  }
}
