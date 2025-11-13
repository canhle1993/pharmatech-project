// src/application/application.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './application.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/role.decorator';

@Controller('api/application')
export class ApplicationController {
  constructor(private readonly appService: ApplicationService) {}

  /** 🟢 Tạo mới đơn ứng tuyển */
  @Post('create')
  async create(@Body() body: CreateApplicationDto) {
    if (!body.account_id || !body.career_id) {
      throw new HttpException(
        'Missing account_id or career_id',
        HttpStatus.BAD_REQUEST,
      );
    }
    const app = await this.appService.create(body);
    return { msg: 'Application submitted successfully', data: app };
  }

  /** 🟢 Lấy tất cả */
  @Get('find-all')
  async findAll() {
    return this.appService.findAll();
  }

  /** 🟢 Lấy danh sách ứng tuyển của 1 user */
  @Get('find-by-account/:account_id')
  async findByAccount(@Param('account_id') account_id: string) {
    return this.appService.findByAccount(account_id);
  }

  /** 🟢 Lấy danh sách ứng tuyển của 1 job */
  @Get('find-by-career/:career_id')
  async findByCareer(@Param('career_id') career_id: string) {
    return this.appService.findByCareer(career_id);
  }

  /** 🟢 Cập nhật trạng thái hồ sơ */
  @Patch('update-status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note?: string,
  ) {
    const result = await this.appService.updateStatus(id, status, note);
    return { msg: 'Application status updated', data: result };
  }

  /** 🟣 SuperAdmin phân công Admin */
  //   @UseGuards(JwtAuthGuard)
  //   @Roles('superadmin')
  @Patch('assign/:id')
  async assignAdmin(
    @Param('id') id: string,
    @Body('admin_id') admin_id: string,
    @Body('admin_name') admin_name: string,
  ) {
    const app = await this.appService.assignAdmin(id, admin_id, admin_name);
    return { msg: 'Admin assigned successfully', data: app };
  }

  /** 🟣 Admin lên lịch phỏng vấn */
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'superadmin')
  @Patch('schedule/:id')
  async scheduleInterview(
    @Param('id') id: string,
    @Body('date') date: Date,
    @Body('location') location: string,
  ) {
    const app = await this.appService.scheduleInterview(id, {
      date,
      location,
    });

    return { msg: 'Interview scheduled successfully', data: app };
  }

  /** 🟣 Admin cập nhật kết quả */
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'superadmin')
  @Patch('result/:id')
  async updateResult(
    @Param('id') id: string,
    @Body('result') result: string,
    @Body('hired_start_date') hired_start_date?: Date,
    @Body('hired_department') hired_department?: string,
  ) {
    const app = await this.appService.updateResult(id, {
      result,
      hired_start_date,
      hired_department,
    });
    return { msg: 'Interview result updated', data: app };
  }

  /** 🟢 Xóa hồ sơ */
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    const success = await this.appService.delete(id);
    if (!success)
      throw new HttpException('Delete failed', HttpStatus.BAD_REQUEST);
    return { msg: 'Application deleted successfully' };
  }
}
