import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BannerService } from './banner.service';

@Controller('api/banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getBanner() {
    try {
      const banner = await this.bannerService.findOne();
      return {
        msg: 'Banner retrieved successfully',
        data: banner || { slide1: '', slide2: '', slide3: '' },
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to retrieve banner',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      storage: diskStorage({
        destination: './upload/banner',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updateBanner(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    try {
      const updateData: any = {};

      // Handle uploaded files
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const slideKey = `slide${index + 1}`;
          updateData[slideKey] = `/upload/banner/${file.filename}`;
        });
      }

      // Merge with existing data if provided in body
      if (body.slide1) updateData.slide1 = body.slide1;
      if (body.slide2) updateData.slide2 = body.slide2;
      if (body.slide3) updateData.slide3 = body.slide3;

      const banner = await this.bannerService.upsert(updateData);

      return {
        msg: 'Banner updated successfully',
        data: banner,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to update banner',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
