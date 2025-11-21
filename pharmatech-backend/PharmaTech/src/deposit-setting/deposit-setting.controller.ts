import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DepositSettingService } from './deposit-setting.service';
import { DepositSettingDTO } from './deposit-setting.dto';

@Controller('api/deposit-setting')
export class DepositSettingController {
  constructor(private depositSettingService: DepositSettingService) {}

  /** 🔹 GET ALL RANGE SETTINGS */
  @Get('find-all')
  async findAll() {
    return await this.depositSettingService.findAll();
  }

  /** 🔹 GET BY ID */
  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const setting = await this.depositSettingService.findById(id);
    if (!setting)
      throw new HttpException(
        'Deposit setting not found',
        HttpStatus.NOT_FOUND,
      );
    return setting;
  }

  /** ✅ CREATE RANGE SETTING (min/max/percent) */
  @Post('create')
  async create(@Body() body: any) {
    try {
      const dto: DepositSettingDTO = {
        min_total: Number(body.min_total),
        max_total: Number(body.max_total),
        percent: Number(body.percent),
        is_active: body.is_active ?? true,
        updated_by: body.updated_by || 'admin',
      } as any;

      const created = await this.depositSettingService.create(dto);
      return {
        message: '✅ Deposit setting created successfully',
        data: created,
      };
    } catch (error) {
      console.error('❌ Create deposit setting error:', error);
      throw new HttpException(
        {
          message: 'Failed to create deposit setting',
          errorMessage: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** ✅ UPDATE RANGE SETTING */
  @Put('update')
  async update(@Body() body: any) {
    try {
      const dto: DepositSettingDTO = {
        id: body.id,
        min_total: Number(body.min_total),
        max_total: Number(body.max_total),
        percent: Number(body.percent),
        is_active: body.is_active ?? true,
        updated_by: body.updated_by || 'admin',
      } as any;

      const updated = await this.depositSettingService.update(dto);
      return {
        message: '✅ Deposit setting updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('❌ Update deposit setting error:', error);
      throw new HttpException(
        {
          message: 'Failed to update deposit setting',
          errorMessage: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** 🔹 SOFT DELETE RANGE SETTING */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body('updated_by') updated_by: string,
  ) {
    return await this.depositSettingService.softDelete(id, updated_by);
  }

  /** 🔹 GET ACTIVE RANGE SETTINGS */
  @Get('find-active')
  async findActive() {
    return await this.depositSettingService.findActive();
  }

  /** 🔹 GET DEFAULT PERCENT */
  @Get('default')
  async getDefault() {
    return await this.depositSettingService.getDefault();
  }

  /** 🔹 UPDATE DEFAULT PERCENT */
  @Put('default')
  async updateDefault(@Body() body: any) {
    return await this.depositSettingService.updateDefault(
      Number(body.default_percent),
      body.updated_by || 'admin',
    );
  }
}
