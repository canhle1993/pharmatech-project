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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './service.dto';

@Controller('api/service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll() {
    return this.serviceService.findAll();
  }

  @Get(':page')
  async findByPage(@Param('page') page: string) {
    return this.serviceService.findByPage(page);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseInterceptors(
    FilesInterceptor('images', 1, {
      storage: diskStorage({
        destination: './upload/service',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `banner-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('=== SERVICE POST REQUEST RECEIVED ===');
    console.log('Received Body:', body);
    console.log('Received files:', files);

    if (!body.page) {
      console.error('ERROR: Missing page field');
      throw new Error('Page field is required');
    }

    const createDto: CreateServiceDto = {
      page: body.page,
      content: body.content || '',
      bannerImage: body.bannerImage,
    };

    // Map uploaded file if exists
    if (files && files.length > 0) {
      createDto.bannerImage = `upload/service/${files[0].filename}`;
      console.log('File uploaded:', createDto.bannerImage);
    }

    try {
      console.log('Calling updateByPage with:', createDto);
      const result = await this.serviceService.updateByPage(createDto);
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('=== ERROR updating service ===');
      console.error('Error details:', error);
      throw error;
    }
  }
}
