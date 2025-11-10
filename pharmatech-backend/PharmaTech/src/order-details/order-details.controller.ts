import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OrderDetailsService } from './order-details.service';
import { OrderDetailsDTO } from './order-details.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// 📁 Lưu ảnh snapshot riêng cho order details
const UPLOAD_DIR = 'uploads/order-details';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('api/order-details')
export class OrderDetailsController {
  constructor(private orderDetailsService: OrderDetailsService) {}

  /** 🔎 Admin xem tất cả */
  @Get('find-all')
  async findAll() {
    return this.orderDetailsService.findAll();
  }

  /** 🔎 Lấy theo order_id */
  @Get('find-by-order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.orderDetailsService.findByOrder(orderId);
  }

  /** ➕ Tạo 1 dòng */
  @Post('create')
  async create(@Body() dto: OrderDetailsDTO) {
    return this.orderDetailsService.createOne(dto);
  }

  /** ➕➕ Tạo nhiều dòng cho 1 order */
  @Post('create-many/:orderId')
  async createMany(
    @Param('orderId') orderId: string,
    @Body() items: OrderDetailsDTO[],
  ) {
    try {
      return await this.orderDetailsService.createMany(items, orderId, 'admin');
    } catch (e: any) {
      throw new HttpException(
        { message: 'Failed to create many order details', error: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ✏️ Cập nhật 1 dòng */
  @Put('update')
  async update(@Body() dto: OrderDetailsDTO) {
    return this.orderDetailsService.update(dto);
  }

  /** 🗑️ Soft delete 1 dòng */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return this.orderDetailsService.softDelete(id, updated_by || 'admin');
  }

  /** 🧹 Soft delete tất cả dòng theo order */
  @Put('soft-delete-by-order/:orderId')
  async softDeleteByOrder(
    @Param('orderId') orderId: string,
    @Body('updated_by') updated_by: string,
  ) {
    return this.orderDetailsService.softDeleteByOrder(
      orderId,
      updated_by || 'admin',
    );
  }

  /** 📤 Upload ảnh snapshot cho order detail (trả về fileName để gán vào product_photo) */
  @Post('upload-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname).toLowerCase());
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext))
          return cb(
            new HttpException('Invalid image type', HttpStatus.BAD_REQUEST),
            false,
          );
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException(
        { message: 'No file uploaded' },
        HttpStatus.BAD_REQUEST,
      );
    }
    // FE sẽ nhận { fileName } để lưu vào field product_photo
    return { fileName: file.filename, path: `${UPLOAD_DIR}/${file.filename}` };
  }
  /** ✅ Dành cho admin đổi trạng thái tất cả items của đơn (test Postman) */
  @Put('update-status/:order_id')
  async updateStatusByOrder(
    @Param('order_id') order_id: string,
    @Body() body: { status: string },
  ) {
    return this.orderDetailsService.updateStatusByOrder(order_id, body.status); // ✅ dùng đúng biến
  }
}
