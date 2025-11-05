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
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './contact.dto';
import * as path from 'path';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContact() {
    return this.contactService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: diskStorage({
        destination: './upload/contact',
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
  async createContact(
    @Body() dto: CreateContactDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.bannerImage = `/upload/contact/${file.filename}`;
    }

    // Parse JSON strings if they exist
    if (typeof dto.addresses === 'string') {
      dto.addresses = JSON.parse(dto.addresses as any);
    }
    if (typeof dto.phones === 'string') {
      dto.phones = JSON.parse(dto.phones as any);
    }
    if (typeof dto.emails === 'string') {
      dto.emails = JSON.parse(dto.emails as any);
    }

    return this.contactService.create(dto);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: diskStorage({
        destination: './upload/contact',
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
  async updateContact(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.bannerImage = `/upload/contact/${file.filename}`;
    }

    // Parse JSON strings if they exist
    if (typeof dto.addresses === 'string') {
      dto.addresses = JSON.parse(dto.addresses as any);
    }
    if (typeof dto.phones === 'string') {
      dto.phones = JSON.parse(dto.phones as any);
    }
    if (typeof dto.emails === 'string') {
      dto.emails = JSON.parse(dto.emails as any);
    }

    return this.contactService.update(id, dto);
  }
}
