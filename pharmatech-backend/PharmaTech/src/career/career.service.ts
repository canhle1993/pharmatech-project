import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCareerDto, UpdateCareerDto } from './career.dto';
import { join } from 'path';

@Injectable()
export class CareerService {
  constructor(
    @InjectModel('Career') private readonly careerModel: Model<any>,
  ) {}

  async create(careerData: CreateCareerDto): Promise<any> {
    const newCareer = new this.careerModel(careerData);
    return newCareer.save();
  }

  async findAll(): Promise<any[]> {
    const careers: any[] = await this.careerModel
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .lean();

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

    return careers.map((career) => ({
      ...career,
      banner: career.banner
        ? `${BASE_URL}/upload/career-banners/${career.banner}`
        : null,
    }));
  }

  async findById(id: string): Promise<any> {
    const job: any = await this.careerModel.findById(id).lean();
    if (!job) throw new NotFoundException('Career not found');

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    job.banner = job.banner
      ? `${BASE_URL}/upload/career-banners/${job.banner}`
      : null;

    return job;
  }

  async update(id: string, updateData: UpdateCareerDto): Promise<any> {
    const updated = await this.careerModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Career not found');
    return updated;
  }

  async delete(id: string): Promise<any> {
    const deleted = await this.careerModel.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true },
    );
    if (!deleted) throw new NotFoundException('Career not found');
    return deleted;
  }
}
