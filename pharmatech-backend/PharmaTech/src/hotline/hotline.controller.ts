import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { CreateHotlineDto, UpdateHotlineDto } from './hotline.dto';
import { HotlineService } from './hotline.service';

@Controller('api/hotline')
export class HotlineController {
  constructor(private readonly hotlineService: HotlineService) {}

  @Get()
  async findAll() {
    return this.hotlineService.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateHotlineDto) {
    return this.hotlineService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateHotlineDto) {
    return this.hotlineService.update(id, updateDto);
  }
}
