<<<<<<< HEAD
// src/career/career.controller.ts
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
import { CareerDTO, CreateCareerDto, UpdateCareerDto } from './career.dto';

const UPLOAD_DIR = './upload/career-banners';
const now = new Date();

=======
import { CreateCareerDto, UpdateCareerDto } from './career.dto';

const UPLOAD_DIR = './upload/career-banners';
const now = new Date();
>>>>>>> origin/main
@Controller('api/career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

<<<<<<< HEAD
  /** =======================================
   * 🟢 CREATE JOB
   * ======================================= */
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
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

=======
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
      quantity: body?.quantity ? Number(body.quantity) : undefined,
      level: body?.level?.trim(),
      experience: body?.experience?.trim(),
      work_type: body?.work_type?.trim(),
      area: body?.area?.trim(),
      // 🆕 Nếu không có posted_date thì set = now
      posted_date: body?.posted_date
        ? String(body.posted_date)
        : now.toISOString(),
      expiration_date: body?.expiration_date
        ? String(body.expiration_date)
        : undefined,
    };

    console.log('BODY RAW >>>', body);
    console.log('RAW AFTER TRIM >>>', raw);

    // map -> DTO và chạy validate thủ công
    const dto = plainToInstance(CreateCareerDto, raw, {
      enableImplicitConversion: true,
    });
>>>>>>> origin/main
    const errors = validateSync(dto, {
      whitelist: true,
      forbidUnknownValues: true,
    });
<<<<<<< HEAD

=======
>>>>>>> origin/main
    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );
    }

<<<<<<< HEAD
    // ✅ Tạo mới job
    return this.careerService.create(dto);
  }

  /** =======================================
   * 🟡 UPDATE JOB
   * ======================================= */
=======
    return this.careerService.create(dto);
  }

>>>>>>> origin/main
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
<<<<<<< HEAD
      ...body,
      banner: file?.filename || undefined,
    };

    // 🧽 Loại field trống
=======
      title: body?.title?.toString().trim(),
      department: body?.department?.toString().trim(),
      location: body?.location?.toString().trim(),
      description: body?.description?.toString().trim(),
      requirements: body?.requirements?.toString().trim(),
      salary_range: body?.salary_range?.toString().trim(),
      banner: file?.filename, // nếu không upload thì sẽ là undefined
      quantity: body?.quantity ? Number(body.quantity) : undefined,
      level: body?.level?.trim(),
      experience: body?.experience?.trim(),
      work_type: body?.work_type?.trim(),
      area: body?.area?.trim(),
      posted_date: body?.posted_date ? String(body.posted_date) : undefined,
      expiration_date: body?.expiration_date
        ? String(body.expiration_date)
        : undefined,
    };

    // loại field trống để phù hợp @IsOptional()
>>>>>>> origin/main
    Object.keys(raw).forEach((k) => {
      const v = (raw as any)[k];
      if (v === undefined || v === '') delete (raw as any)[k];
    });

<<<<<<< HEAD
    console.log('📦 [UPDATE] Parsed raw before DTO:', raw);

    // 🧩 Map sang DTO + validate
    const dto = plainToInstance(UpdateCareerDto, raw, {
      enableImplicitConversion: true,
    });

=======
    const dto = plainToInstance(UpdateCareerDto, raw, {
      enableImplicitConversion: true,
    });
>>>>>>> origin/main
    const errors = validateSync(dto, {
      whitelist: true,
      forbidUnknownValues: true,
    });
<<<<<<< HEAD

=======
>>>>>>> origin/main
    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );
    }

<<<<<<< HEAD
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
=======
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

>>>>>>> origin/main
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.careerService.delete(id);
  }
}
