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
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const dto: CreateAboutDto = {
        content: body.content || '',
      };

      if (file) {
        dto.bannerImage = `/upload/about/${file.filename}`;
      }

      // Parse JSON strings if they exist
      if (body.team) {
        dto.team =
          typeof body.team === 'string' ? JSON.parse(body.team) : body.team;
      }
      if (body.testimonials) {
        dto.testimonials =
          typeof body.testimonials === 'string'
            ? JSON.parse(body.testimonials)
            : body.testimonials;
      }
      if (body.brandImages) {
        dto.brandImages =
          typeof body.brandImages === 'string'
            ? JSON.parse(body.brandImages)
            : body.brandImages;
      }
      if (body.intro) {
        dto.intro =
          typeof body.intro === 'string' ? JSON.parse(body.intro) : body.intro;
      }
      if (body.cta) {
        dto.cta =
          typeof body.cta === 'string' ? JSON.parse(body.cta) : body.cta;
      }
      if (body.open) {
        dto.open =
          typeof body.open === 'string' ? JSON.parse(body.open) : body.open;
      }
      if (body.schedule) {
        dto.schedule =
          typeof body.schedule === 'string'
            ? JSON.parse(body.schedule)
            : body.schedule;
      }
      if (body.teamSection) {
        dto.teamSection =
          typeof body.teamSection === 'string'
            ? JSON.parse(body.teamSection)
            : body.teamSection;
      }
      if (body.testimonialsSection) {
        dto.testimonialsSection =
          typeof body.testimonialsSection === 'string'
            ? JSON.parse(body.testimonialsSection)
            : body.testimonialsSection;
      }

      return this.aboutService.create(dto);
    } catch (error) {
      console.error('Error creating about:', error);
      throw new BadRequestException(
        error.message || 'Failed to create about data',
      );
    }
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
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const dto: CreateAboutDto = {
        content: body.content || '',
      };

      if (file) {
        dto.bannerImage = `/upload/about/${file.filename}`;
      }

      // Parse JSON strings if they exist
      if (body.team) {
        dto.team =
          typeof body.team === 'string' ? JSON.parse(body.team) : body.team;
      }
      if (body.testimonials) {
        dto.testimonials =
          typeof body.testimonials === 'string'
            ? JSON.parse(body.testimonials)
            : body.testimonials;
      }
      if (body.brandImages) {
        dto.brandImages =
          typeof body.brandImages === 'string'
            ? JSON.parse(body.brandImages)
            : body.brandImages;
      }
      if (body.intro) {
        dto.intro =
          typeof body.intro === 'string' ? JSON.parse(body.intro) : body.intro;
      }
      if (body.cta) {
        dto.cta =
          typeof body.cta === 'string' ? JSON.parse(body.cta) : body.cta;
      }
      if (body.open) {
        dto.open =
          typeof body.open === 'string' ? JSON.parse(body.open) : body.open;
      }
      if (body.schedule) {
        dto.schedule =
          typeof body.schedule === 'string'
            ? JSON.parse(body.schedule)
            : body.schedule;
      }
      if (body.teamSection) {
        dto.teamSection =
          typeof body.teamSection === 'string'
            ? JSON.parse(body.teamSection)
            : body.teamSection;
      }
      if (body.testimonialsSection) {
        dto.testimonialsSection =
          typeof body.testimonialsSection === 'string'
            ? JSON.parse(body.testimonialsSection)
            : body.testimonialsSection;
      }

      return this.aboutService.update(id, dto);
    } catch (error) {
      console.error('Error updating about:', error);
      throw new BadRequestException(
        error.message || 'Failed to update about data',
      );
    }
  }
}
