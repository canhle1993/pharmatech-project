import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { SavedJob } from './savejob.decorator';
import { plainToInstance } from 'class-transformer';
import { CareerDTO } from 'src/career/career.dto';

@Injectable()
export class SaveJobService {
  constructor(
    @InjectModel(SavedJob.name)
    private readonly saveJobModel: Model<SavedJob & mongoose.Document>,
  ) {}

  /** ⭐ Save job (avoid duplicate) */
  async saveJob(user_id: string, job_id: string) {
    const exists = await this.saveJobModel.findOne({ user_id, job_id });

    if (exists) {
      throw new HttpException('Job already saved', HttpStatus.BAD_REQUEST);
    }

    return await this.saveJobModel.create({
      user_id,
      job_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /** ⭐ Get all saved jobs */
  async getSavedJobs(user_id: string) {
    const saved = await this.saveJobModel
      .find({ user_id })
      .populate('job_id')
      .sort({ createdAt: -1 })
      .lean();

    return saved; // TRẢ RAW DATA
  }
}
