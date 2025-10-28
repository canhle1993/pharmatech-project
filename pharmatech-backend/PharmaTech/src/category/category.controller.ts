import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryDTO } from './category.dto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    let categoryDTO = await this.categoryService.findById(id);
    if (categoryDTO == null) {
      throw new HttpException('Id Not Found', HttpStatus.NOT_FOUND);
    } else {
      return categoryDTO;
    }
  }

  @Get('find-by-keyword/:keyword')
  findByKeyword(@Param('keyword') keyword: string) {
    return this.categoryService.findByKeyword(keyword);
  }

  @Get('find-all')
  findAll() {
    return this.categoryService.findAll();
  }

  @Post('create')
  async create(@Body() categoryDTO: CategoryDTO) {
    return await this.categoryService.create(categoryDTO);
  }

  @Put('update')
  async update(@Body() categoryDTO: CategoryDTO) {
    return await this.categoryService.update(categoryDTO);
  }

  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.categoryService.delete(id, updated_by);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4().replace(/-/g, '');
          const extension = extname(file.originalname);
          cb(null, uniqueName + extension);
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: 'http://localhost:3000/upload/' + file.filename,
    };
  }
}
