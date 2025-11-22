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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './contact.dto';
import * as path from 'path';

@Controller('api/contact')
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
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const dto: CreateContactDto = {
        content: body.content || '',
        mapUrl: body.mapUrl || '',
      };

      if (file) {
        dto.bannerImage = `/upload/contact/${file.filename}`;
      }

      // Parse JSON strings if they exist
      if (body.addresses) {
        dto.addresses =
          typeof body.addresses === 'string'
            ? JSON.parse(body.addresses)
            : body.addresses;
      }
      if (body.phones) {
        dto.phones =
          typeof body.phones === 'string'
            ? JSON.parse(body.phones)
            : body.phones;
      }
      if (body.emails) {
        dto.emails =
          typeof body.emails === 'string'
            ? JSON.parse(body.emails)
            : body.emails;
      }

      return this.contactService.create(dto);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new BadRequestException(
        error.message || 'Failed to create contact',
      );
    }
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
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const dto: UpdateContactDto = {
        content: body.content,
        mapUrl: body.mapUrl || '',
      };

      if (file) {
        dto.bannerImage = `/upload/contact/${file.filename}`;
      } else if (body.bannerImage) {
        dto.bannerImage = body.bannerImage;
      }

      // Parse JSON strings if they exist
      if (body.addresses) {
        dto.addresses =
          typeof body.addresses === 'string'
            ? JSON.parse(body.addresses)
            : body.addresses;
      }
      if (body.phones) {
        dto.phones =
          typeof body.phones === 'string'
            ? JSON.parse(body.phones)
            : body.phones;
      }
      if (body.emails) {
        dto.emails =
          typeof body.emails === 'string'
            ? JSON.parse(body.emails)
            : body.emails;
      }

      return this.contactService.update(id, dto);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new BadRequestException(
        error.message || 'Failed to update contact',
      );
    }
  }
}
