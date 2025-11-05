// src/career/career.controller.ts
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
import { CareerDTO, CreateCareerDto, UpdateCareerDto } from './career.dto';

const UPLOAD_DIR = './upload/career-banners';
const now = new Date();

@Controller('api/career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  /** =======================================
   * 🟢 CREATE JOB
   * ======================================= */
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
    console.log('📦 [CREATE] Raw body received from FE:', body);
    // 🧹 Chuẩn hóa dữ liệu: gộp body và file
    const raw = {
      ...body,
      banner: file?.filename || undefined,
      posted_date: body?.posted_date
        ? String(body.posted_date)
        : now.toISOString(),
      expiration_date: body?.expiration_date || undefined,
    };

    // 🧽 Loại field rỗng hoặc undefined
    Object.keys(raw).forEach((k) => {
      const v = (raw as any)[k];
      if (v === undefined || v === '') delete (raw as any)[k];
    });

    console.log('📦 [CREATE] Parsed raw before DTO:', raw);

    // 🧩 Map sang DTO + validate
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

    // ✅ Tạo mới job
    return this.careerService.create(dto);
  }

  /** =======================================
   * 🟡 UPDATE JOB
   * ======================================= */
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
      ...body,
      banner: file?.filename || undefined,
    };

    // 🧽 Loại field trống
    Object.keys(raw).forEach((k) => {
      const v = (raw as any)[k];
      if (v === undefined || v === '') delete (raw as any)[k];
    });

    console.log('📦 [UPDATE] Parsed raw before DTO:', raw);

    // 🧩 Map sang DTO + validate
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

    // ✅ Cập nhật job
    return this.careerService.update(id, dto);
  }

  /** =======================================
   * 🔵 GET ALL JOBS
   * ======================================= */
  @Get()
  async findAll() {
    const careers = await this.careerService.findAll();
    return plainToInstance(CareerDTO, careers, {
      excludeExtraneousValues: true,
    });
  }

  /** =======================================
   * 🟣 GET JOB BY ID
   * ======================================= */
  @Get(':id')
  async findById(@Param('id') id: string) {
    const career = await this.careerService.findById(id);
    return plainToInstance(CareerDTO, career, {
      excludeExtraneousValues: true,
    });
  }

  /** =======================================
   * 🔴 DELETE JOB (SOFT DELETE)
   * ======================================= */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.careerService.delete(id);
  }
}
