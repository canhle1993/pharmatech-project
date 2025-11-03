import {
  Body,
  Controller,
  Get,
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

@Controller('api/product')
export class ProductController {
  constructor(private productService: ProductService) {}

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
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: 'http://localhost:3000/upload/' + file.filename,
    };
  }

  @Get('find-active')
  async findActive() {
    return this.productService.findActive();
  }
}
