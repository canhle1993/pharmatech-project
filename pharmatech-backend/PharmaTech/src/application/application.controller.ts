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
  Put,
  Query,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './application.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('api/application')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
  constructor(private readonly appService: ApplicationService) {}

  /** 🟢 Tạo mới đơn ứng tuyển */
  @Post('create')
  @Roles('user')
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
  @Roles('admin', 'superadmin')
  async findAll() {
    return this.appService.findAll();
  }

  /** 🟣 GET HISTORY (INACTIVE) */
  @Get('history')
  @Roles('admin', 'superadmin')
  async history() {
    return this.appService.findHistory();
  }

  /** 🔄 RESTORE APPLICATION */
  @Put('restore/:id')
  @Roles('admin', 'superadmin')
  async restore(@Param('id') id: string) {
    const ok = await this.appService.restore(id);
    if (!ok) throw new HttpException('Restore failed', HttpStatus.BAD_REQUEST);

    return { msg: 'Application restored successfully' };
  }

  /** ☠️ DELETE PERMANENT */
  @Delete('delete-permanent/:id')
  @Roles('superadmin')
  async deletePermanent(@Param('id') id: string) {
    const ok = await this.appService.deletePermanent(id);
    if (!ok)
      throw new HttpException(
        'Delete permanent failed',
        HttpStatus.BAD_REQUEST,
      );

    return { msg: 'Application permanently deleted' };
  }

  /** 🟢 Lấy danh sách ứng tuyển của 1 user */
  @Get('find-by-account/:account_id')
  @Roles('user', 'admin', 'superadmin')
  async findByAccount(@Param('account_id') account_id: string) {
    return this.appService.findByAccount(account_id);
  }

  /** 🟢 Lấy danh sách ứng tuyển của 1 job */
  @Get('find-by-career/:career_id')
  @Roles('admin', 'superadmin')
  async findByCareer(@Param('career_id') career_id: string) {
    return this.appService.findByCareer(career_id);
  }

  /** 🔍 CHECK duplicated application */
  @Get('check-duplicate')
  @Roles('user')
  async checkDuplicate(
    @Query('user_id') user_id: string,
    @Query('career_id') career_id: string,
  ) {
    if (!user_id || !career_id) {
      throw new HttpException(
        'Missing user_id or career_id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const applied = await this.appService.checkDuplicate(user_id, career_id);
    return { applied };
  }

  /** 🟢 Cập nhật trạng thái hồ sơ */
  @Patch('update-status/:id')
  @Roles('admin', 'superadmin')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note?: string,
  ) {
    const result = await this.appService.updateStatus(id, status, note);
    return { msg: 'Application status updated', data: result };
  }

  /** 🟣 SuperAdmin phân công Admin */
  @Patch('assign/:id')
  @Roles('superadmin')
  async assignAdmin(
    @Param('id') id: string,
    @Body('admin_id') admin_id: string,
    @Body('admin_name') admin_name: string,
  ) {
    const app = await this.appService.assignAdmin(id, admin_id, admin_name);
    return { msg: 'Admin assigned successfully', data: app };
  }

  /** ✨ NEW: Generate default email template */
  @Get('generate-template/:id')
  @Roles('admin', 'superadmin')
  async generateTemplate(@Param('id') id: string) {
    const html = await this.appService.generateEmailTemplate(id);
    return { template: html };
  }

  /** ✨ Generate PASS Email Template */
  @Get('generate-pass-template/:id')
  @Roles('admin', 'superadmin')
  async generatePassTemplate(@Param('id') id: string) {
    const html = await this.appService.generatePassTemplate(id);
    return { template: html };
  }

  /** ✨ Generate REJECT Email Template */
  @Get('generate-reject-template/:id')
  @Roles('admin', 'superadmin')
  async generateRejectTemplate(@Param('id') id: string) {
    const html = await this.appService.generateRejectTemplate(id);
    return { template: html };
  }

  /** 🟣 Admin lên lịch phỏng vấn */
  // @UseGuards(JwtAuthGuard)
  // @Roles('admin', 'superadmin')
  @Patch('schedule/:id')
  @Roles('admin', 'superadmin')
  async scheduleInterview(
    @Param('id') id: string,
    @Body('date') date: Date,
    @Body('location') location: string,
    @Body('email_content') email_content: string, // 🔥 ADD THIS
  ) {
    if (!email_content) {
      throw new HttpException('Missing email content', HttpStatus.BAD_REQUEST);
    }

    const app = await this.appService.scheduleInterview(id, {
      date,
      location,
      email_content,
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

  /** 🟩 Mark as PASS */
  @Patch('mark-pass/:id')
  @Roles('admin', 'superadmin')
  async markPass(
    @Param('id') id: string,
    @Body('start_work_date') start_work_date: Date,
    @Body('location') location: string,
    @Body('email_content') email_content: string,
  ) {
    if (!email_content?.trim()) {
      throw new HttpException('Missing email content', HttpStatus.BAD_REQUEST);
    }

    const app = await this.appService.markAsPass(id, {
      start_work_date,
      location,
      email_content,
    });

    return { msg: 'Candidate marked as PASS', data: app };
  }

  /** 🟥 Mark as REJECT */
  @Patch('mark-reject/:id')
  @Roles('admin', 'superadmin')
  async markReject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('email_content') email_content: string,
    @Body('rejected_by') rejected_by: string,
  ) {
    if (!email_content?.trim()) {
      throw new HttpException(
        'Reject email content is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const app = await this.appService.markAsReject(id, {
      reason,
      email_content,
      rejected_by,
    });

    return { msg: 'Candidate marked as REJECTED', data: app };
  }

  /** 🟡 SOFT DELETE → MOVE TO HISTORY */
  @Delete(':id')
  @Roles('admin', 'superadmin')
  async delete(@Param('id') id: string) {
    const success = await this.appService.delete(id);
    if (!success)
      throw new HttpException('Delete failed', HttpStatus.BAD_REQUEST);

    return { msg: 'Application moved to history' };
  }
}
