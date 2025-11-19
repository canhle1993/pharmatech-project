import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from './banner.schema';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<Banner>,
  ) {}

  async findOne(): Promise<Banner | null> {
    // Return the first (and only) banner document
    return this.bannerModel.findOne().exec();
  }

  async create(data: Partial<Banner>): Promise<Banner> {
    const banner = new this.bannerModel(data);
    return banner.save();
  }

  async update(id: string, data: Partial<Banner>): Promise<Banner | null> {
    return this.bannerModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async upsert(data: Partial<Banner>): Promise<Banner> {
    // Find existing banner or create new one
    const existing = await this.findOne();
    if (existing) {
      return this.update(existing._id.toString(), data);
    }
    return this.create(data);
  }
}
