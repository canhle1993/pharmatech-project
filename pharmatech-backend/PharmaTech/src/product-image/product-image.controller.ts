import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  Body,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ProductImageDTO } from './product-image.dto';

@Controller('api/product-image')
export class ProductImageController {
  constructor(private productImageService: ProductImageService) {}

  /** ✅ Upload ảnh chính (1 ảnh duy nhất) */
  @Post('upload-main')
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
  async uploadMain(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      const dto = new ProductImageDTO();
      dto.product_id = body.product_id;
      dto.url = file.filename;
      dto.caption = body.caption || 'Main image';
      dto.updated_by = body.updated_by || 'admin';
      dto.is_main = true;

      const created = await this.productImageService.create(dto);

      return {
        message: '✅ Main image uploaded successfully',
        data: created,
      };
    } catch (error) {
      console.error('❌ Upload main image error:', error);
      throw new HttpException(
        { message: 'Failed to upload main image', errorMessage: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ✅ Upload nhiều ảnh gallery */
  @Post('upload-gallery')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
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
  async uploadGallery(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    try {
      const uploaded = [];
      for (const file of files) {
        const dto = new ProductImageDTO();
        dto.product_id = body.product_id;
        dto.url = file.filename;
        dto.caption = body.caption || 'Gallery image';
        dto.updated_by = body.updated_by || 'admin';
        dto.is_main = false;

        const created = await this.productImageService.create(dto);
        uploaded.push(created);
      }

      return {
        message: `✅ ${uploaded.length} gallery image(s) uploaded successfully`,
        data: uploaded,
      };
    } catch (error) {
      console.error('❌ Upload gallery images error:', error);
      throw new HttpException(
        {
          message: 'Failed to upload gallery images',
          errorMessage: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ✅ Lấy danh sách ảnh theo Product */
  @Get('find-by-product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return await this.productImageService.findByProduct(productId);
  }

  /** ✅ Xóa ảnh */
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.productImageService.delete(id);
  }
}
