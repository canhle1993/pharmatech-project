import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
   *  🟢 CREATE
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
    const raw = {
      ...body,
      banner: file?.filename || undefined,
      posted_date: body?.posted_date
        ? String(body.posted_date)
        : now.toISOString(),
      expiration_date: body?.expiration_date || undefined,
    };

    Object.keys(raw).forEach((k) => {
      if (raw[k] === '' || raw[k] === undefined) delete raw[k];
    });

    const dto = plainToInstance(CreateCareerDto, raw, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(dto, { whitelist: true });
    if (errors.length)
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );

    const created = await this.careerService.create(dto);
    return { msg: 'Job created', data: created };
  }

  /** =======================================
   *  🟡 UPDATE
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
    const raw = { ...body, banner: file?.filename || undefined };

    Object.keys(raw).forEach((k) => {
      if (raw[k] === '' || raw[k] === undefined) delete raw[k];
    });

    const dto = plainToInstance(UpdateCareerDto, raw, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(dto, { whitelist: true });
    if (errors.length)
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );

    const updated = await this.careerService.update(id, dto);
    return { msg: 'Job updated', data: updated };
  }

  /** =======================================
   *  🔵 GET ALL ACTIVE
   * ======================================= */
  @Get()
  async findAll() {
    await this.careerService.autoExpire(); // ⭐ tự động expire trước khi trả data
    return await this.careerService.findAll();
  }

  /** =======================================
   *  🟣 HISTORY (inactive jobs)
   * ======================================= */
  @Get('history')
  async history() {
    return await this.careerService.findHistory();
  }

  /** =======================================
   *  🔄 RESTORE
   * ======================================= */
  @Put('restore/:id')
  async restore(@Param('id') id: string) {
    return await this.careerService.restore(id);
  }

  /** =======================================
   *  ☠️ DELETE PERMANENT
   * ======================================= */
  @Delete('delete-permanent/:id')
  async deletePermanent(@Param('id') id: string) {
    const ok = await this.careerService.deletePermanent(id);
    if (!ok) throw new NotFoundException('Career not found');
    return { message: 'Career permanently deleted' };
  }

  /** =======================================
   *  🧭 SIMILAR JOBS
   * ======================================= */
  @Get('similar/:id')
  async getSimilar(@Param('id') id: string) {
    return await this.careerService.findSimilarById(id);
  }

  /** =======================================
   *  🗑️ SOFT DELETE
   * ======================================= */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.careerService.delete(id);
    if (!ok) throw new BadRequestException('Soft delete failed');
    return { msg: 'Job inactive' };
  }

  /** =======================================
   *  🔍 GET BY ID
   * ======================================= */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.careerService.findById(id);
  }
}
