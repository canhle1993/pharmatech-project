import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AboutService } from './about.service';
import { CreateAboutDto } from './about.dto';
import * as path from 'path';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  getAbout() {
    return this.aboutService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: diskStorage({
        destination: './upload/about',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async createAbout(
    @Body() dto: CreateAboutDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.bannerImage = `/upload/about/${file.filename}`;
    }

    // Parse JSON strings if they exist
    if (typeof dto.team === 'string') {
      dto.team = JSON.parse(dto.team as any);
    }
    if (typeof dto.testimonials === 'string') {
      dto.testimonials = JSON.parse(dto.testimonials as any);
    }
    if (typeof dto.brandImages === 'string') {
      dto.brandImages = JSON.parse(dto.brandImages as any);
    }
    if (typeof dto.intro === 'string') {
      dto.intro = JSON.parse(dto.intro as any);
    }
    if (typeof dto.cta === 'string') {
      dto.cta = JSON.parse(dto.cta as any);
    }
    if (typeof dto.open === 'string') {
      dto.open = JSON.parse(dto.open as any);
    }
    if (typeof dto.schedule === 'string') {
      dto.schedule = JSON.parse(dto.schedule as any);
    }
    if (typeof dto.teamSection === 'string') {
      dto.teamSection = JSON.parse(dto.teamSection as any);
    }
    if (typeof dto.testimonialsSection === 'string') {
      dto.testimonialsSection = JSON.parse(dto.testimonialsSection as any);
    }

    return this.aboutService.create(dto);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: diskStorage({
        destination: './upload/about',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateAbout(
    @Param('id') id: string,
    @Body() dto: CreateAboutDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.bannerImage = `/upload/about/${file.filename}`;
    }

    // Parse JSON strings if they exist
    if (typeof dto.team === 'string') {
      dto.team = JSON.parse(dto.team as any);
    }
    if (typeof dto.testimonials === 'string') {
      dto.testimonials = JSON.parse(dto.testimonials as any);
    }
    if (typeof dto.brandImages === 'string') {
      dto.brandImages = JSON.parse(dto.brandImages as any);
    }
    if (typeof dto.intro === 'string') {
      dto.intro = JSON.parse(dto.intro as any);
    }
    if (typeof dto.cta === 'string') {
      dto.cta = JSON.parse(dto.cta as any);
    }
    if (typeof dto.open === 'string') {
      dto.open = JSON.parse(dto.open as any);
    }
    if (typeof dto.schedule === 'string') {
      dto.schedule = JSON.parse(dto.schedule as any);
    }
    if (typeof dto.teamSection === 'string') {
      dto.teamSection = JSON.parse(dto.teamSection as any);
    }
    if (typeof dto.testimonialsSection === 'string') {
      dto.testimonialsSection = JSON.parse(dto.testimonialsSection as any);
    }

    return this.aboutService.update(id, dto);
  }
}
