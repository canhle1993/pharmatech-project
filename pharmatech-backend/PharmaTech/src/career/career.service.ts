import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCareerDto, UpdateCareerDto } from './career.dto';

type CareerLean = {
  _id?: any;
  banner?: string | null;
  is_active?: boolean;
  created_at?: Date;
  posted_date?: Date | string | null;
  updated_at?: Date;
  title?: string;
  department?: string;
  description?: string;
  location?: string;
  salary_range?: string;
  requirements?: string;
  [k: string]: any;
};

@Injectable()
export class CareerService {
  constructor(
    @InjectModel('Career') private readonly careerModel: Model<any>,
  ) {}

  /** Tạo job mới */
  async create(careerData: CreateCareerDto): Promise<any> {
    const now = new Date();

    // ép posted_date và created_at trùng nhau tuyệt đối nếu không có posted_date
    const posted = careerData.posted_date
      ? new Date(careerData.posted_date)
      : now;

    const data: CareerLean = {
      ...careerData,
      created_at: now,
      posted_date: posted,
      updated_at: now, // thêm luôn để đồng bộ
      is_active: true,
    };

    const doc = new this.careerModel(data);
    const saved = await doc.save();

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    return {
      ...saved.toObject(),
      banner: saved.banner
        ? `${BASE_URL}/upload/career-banners/${saved.banner}`
        : null,
    };
  }

  /** Lấy tất cả job */
  async findAll(): Promise<any[]> {
    // định kiểu lean để tránh union sai
    const careers = await this.careerModel
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .lean<CareerLean[]>();

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

    return careers.map((c) => ({
      ...c,
      banner: c.banner ? `${BASE_URL}/upload/career-banners/${c.banner}` : null,
    }));
  }

  /** Lấy chi tiết job */
  async findById(id: string): Promise<any> {
    // định kiểu rõ ràng, không còn union với []
    const job = await this.careerModel.findById(id).lean<CareerLean | null>();
    if (!job) throw new NotFoundException('Career not found');

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    return {
      ...job,
      banner: job.banner
        ? `${BASE_URL}/upload/career-banners/${job.banner}`
        : null,
    };
  }

  /** Cập nhật job */
  async update(id: string, updateData: UpdateCareerDto): Promise<any> {
    const existing = await this.careerModel
      .findById(id)
      .lean<CareerLean | null>();
    if (!existing) throw new NotFoundException('Career not found');

    const data: Partial<CareerLean> = {
      ...updateData,
      updated_at: new Date(),
      // giữ nguyên created_at, không cho client override
      created_at: existing.created_at,
    };

    const updated = await this.careerModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

    return {
      ...updated.toObject(),
      banner: updated.banner
        ? `${BASE_URL}/upload/career-banners/${updated.banner}`
        : null,
    };
  }

  /** Xoá mềm job */
  async delete(id: string): Promise<any> {
    const deleted = await this.careerModel.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true },
    );
    if (!deleted) throw new NotFoundException('Career not found');
    return deleted;
  }
}
