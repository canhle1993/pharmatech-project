// src/about/about.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { About, AboutDocument } from './about.schema';
import { CreateAboutDto } from './about.dto';

@Injectable()
export class AboutService {
  constructor(@InjectModel(About.name) private aboutModel: Model<AboutDocument>) {}

  async create(dto: CreateAboutDto) {
    const created = new this.aboutModel(dto);
    return created.save();
  }

  async findAll() {
    return this.aboutModel.findOne().exec(); // chỉ lấy 1 bản ghi
  }

  async update(id: string, dto: CreateAboutDto) {
    return this.aboutModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }
}
