import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './purchase.dto';

@Controller('api/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  async findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':page')
  async findByPage(@Param('page') page: string) {
    return this.purchaseService.findByPage(page);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseInterceptors(
    FilesInterceptor('images', 1, {
      storage: diskStorage({
        destination: './upload/purchase',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `banner-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('=== PURCHASE POST REQUEST RECEIVED ===');
    console.log('Received Body:', body);
    console.log('Received files:', files);

    if (!body.page) {
      console.error('ERROR: Missing page field');
      throw new Error('Page field is required');
    }

    const createDto: CreatePurchaseDto = {
      page: body.page,
      content: body.content || '',
      bannerImage: body.bannerImage,
    };

    // Map uploaded file if exists
    if (files && files.length > 0) {
      createDto.bannerImage = `upload/purchase/${files[0].filename}`;
      console.log('File uploaded:', createDto.bannerImage);
    }

    try {
      console.log('Calling updateByPage with:', createDto);
      const result = await this.purchaseService.updateByPage(createDto);
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('=== ERROR updating purchase ===');
      console.error('Error details:', error);
      throw error;
    }
  }
}
