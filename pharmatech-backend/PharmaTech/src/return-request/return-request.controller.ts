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
  Query,
} from '@nestjs/common';
import { ReturnRequestService } from './return-request.service';
import { ReturnRequestDTO } from './return-request.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { getImageUrl } from 'src/order/config.util';

const UPLOAD_DIR = './upload';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

@Controller('api/returns')
export class ReturnRequestController {
  constructor(private readonly returnService: ReturnRequestService) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  @Get('find-all')
  async findAll(@Query('status') status?: string) {
    try {
      if (status) {
        return await this.returnService.findByStatus(status);
      }
      return await this.returnService.findAll();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to load return requests', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    try {
      return await this.returnService.findById(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to load return request', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // ➕ TẠO YÊU CẦU ĐỔI HÀNG
  // ==================================================

  @Post('create')
  async create(
    @Body()
    body: {
      order_id: string;
      order_detail_ids: string[];
      replacement_product_id: string;
      reason?: string;
      damage_photos?: string[];
      updated_by?: string;
    },
  ): Promise<ReturnRequestDTO> {
    try {
      return await this.returnService.create(body);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create return request', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================================================
  // 📤 UPLOAD ẢNH HƯ HẠI
  // ==================================================

  UPLOAD_DIR = './upload';

  @Post('upload-damage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'damage_' + unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(
            new HttpException('Invalid image type', HttpStatus.BAD_REQUEST),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDamage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    return {
      message: 'Damage image uploaded successfully',
      filename: file.filename,
      url: getImageUrl() + file.filename, // TRẢ VỀ ĐÚNG BASE URL
    };
  }

  // ==================================================
  // 🔄 CẬP NHẬT TRẠNG THÁI
  // ==================================================

  /** ✅ Admin bấm "Đã nhận hàng mới" */
  @Put('mark-completed/:id')
  async markCompleted(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    try {
      return await this.returnService.markCompleted(id, updated_by || 'admin');
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to mark completed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🗑️ Soft delete */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    try {
      return await this.returnService.softDelete(id, updated_by || 'admin');
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to delete return request', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
