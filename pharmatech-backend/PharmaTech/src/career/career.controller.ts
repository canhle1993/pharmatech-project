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
   * 🟢 CREATE NEW JOB
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

    // 🧹 Chuẩn hóa dữ liệu
    const raw = {
      ...body,
      banner: file?.filename || undefined,
      posted_date: body?.posted_date
        ? String(body.posted_date)
        : now.toISOString(),
      expiration_date: body?.expiration_date || undefined,
    };

    // 🧽 Loại bỏ field rỗng
    Object.keys(raw).forEach((k) => {
      const v = (raw as any)[k];
      if (v === undefined || v === '') delete (raw as any)[k];
    });

    console.log('📦 [CREATE] Parsed raw before DTO:', raw);

    // 🧩 Validate DTO
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

    // ✅ Tạo job và tự động gửi mail đến user liên quan
    const created = await this.careerService.create(dto);
    return {
      msg: 'Job created successfully and notifications sent.',
      data: created,
    };
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
    console.log('📦 [UPDATE] Raw body received:', body);

    const raw = {
      ...body,
      banner: file?.filename || undefined,
    };

    // 🧽 Loại field rỗng
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

    const updated = await this.careerService.update(id, dto);
    return { msg: 'Job updated successfully', data: updated };
  }

  /** =======================================
   * 🔵 GET ALL JOBS
   * ======================================= */
  @Get()
  async findAll() {
    // ❌ Không cần transform thêm lần nữa
    return await this.careerService.findAll();
  }

  /** =======================================
   * 🟣 GET JOB BY ID
   * ======================================= */
  @Get(':id')
  async findById(@Param('id') id: string) {
    // ❌ Không cần transform lại
    return await this.careerService.findById(id);
  }

  /** =======================================
   * 🧭 GET SIMILAR JOBS
   * ======================================= */
  @Get('similar/:id')
  async getSimilar(@Param('id') id: string): Promise<CareerDTO[]> {
    return await this.careerService.findSimilarById(id);
  }

  /** =======================================
   * 🔴 SOFT DELETE JOB
   * ======================================= */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.careerService.delete(id);
    if (!ok) throw new BadRequestException('Soft delete failed');
    return { msg: 'Job marked as inactive successfully' };
  }
}
