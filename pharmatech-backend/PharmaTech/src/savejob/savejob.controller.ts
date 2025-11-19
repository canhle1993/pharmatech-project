import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { SaveJobService } from './savejob.service';
import { SaveJobDto, SavedJobDTO } from './savejob.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Controller('api/savejob')
export class SaveJobController {
  constructor(private readonly saveJobService: SaveJobService) {}

  /** 🟢 SAVE JOB */
  @Post()
  async saveJob(@Body() body: SaveJobDto) {
    // Convert + Validate
    const dto = plainToInstance(SaveJobDto, body);
    const errors = validateSync(dto, { whitelist: true });

    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints ?? {})).flat(),
      );
    }

    const saved = await this.saveJobService.saveJob(dto.user_id, dto.job_id);

    return {
      msg: 'Job saved successfully',
      data: saved,
    };
  }

  /** 🟢 GET SAVED JOBS */
  /** 🟢 GET SAVED JOBS */
  @Get(':user_id')
  async getSaved(@Param('user_id') user_id: string) {
    const data = await this.saveJobService.getSavedJobs(user_id);

    return plainToInstance(SavedJobDTO, data, {
      excludeExtraneousValues: true,
    });
  }
}
