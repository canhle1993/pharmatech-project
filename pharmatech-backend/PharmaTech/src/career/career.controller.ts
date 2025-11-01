import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CareerService } from './career.service';
import { CreateCareerDto, UpdateCareerDto } from './career.dto';

const UPLOAD_DIR = './upload/career-banners';

@Controller('api/career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    // ép/trim dữ liệu text an toàn
    const raw = {
      title: body?.title ? String(body.title).trim() : undefined,
      department: body?.department ? String(body.department).trim() : undefined,
      location: body?.location ? String(body.location).trim() : undefined,
      description: body?.description
        ? String(body.description).trim()
        : undefined,
      requirements: body?.requirements
        ? String(body.requirements).trim()
        : undefined,
      salary_range: body?.salary_range
        ? String(body.salary_range).trim()
        : undefined,
      posted_by: body?.posted_by ? String(body.posted_by).trim() : undefined,
      banner: file?.filename || undefined,
    };

    console.log('BODY RAW >>>', body);
    console.log('RAW AFTER TRIM >>>', raw);

    // map -> DTO và chạy validate thủ công
    const dto = plainToInstance(CreateCareerDto, raw, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidUnknownValues: true,
    });
    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );
    }

    return this.careerService.create(dto);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const raw = {
      title: body?.title?.toString().trim(),
      department: body?.department?.toString().trim(),
      location: body?.location?.toString().trim(),
      description: body?.description?.toString().trim(),
      requirements: body?.requirements?.toString().trim(),
      salary_range: body?.salary_range?.toString().trim(),
      banner: file?.filename, // nếu không upload thì sẽ là undefined
    };

    // loại field trống để phù hợp @IsOptional()
    Object.keys(raw).forEach((k) => {
      const v = (raw as any)[k];
      if (v === undefined || v === '') delete (raw as any)[k];
    });

    const dto = plainToInstance(UpdateCareerDto, raw, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidUnknownValues: true,
    });
    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );
    }

    return this.careerService.update(id, dto);
  }

  @Get()
  async findAll() {
    return this.careerService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.careerService.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.careerService.delete(id);
  }
}
