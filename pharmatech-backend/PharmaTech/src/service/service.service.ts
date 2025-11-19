import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from './service.schema';
import { CreateServiceDto, UpdateServiceDto } from './service.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}

  async create(createDto: CreateServiceDto): Promise<Service> {
    const created = new this.serviceModel(createDto);
    return created.save();
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().exec();
  }

  async findByPage(page: string): Promise<Service | null> {
    return this.serviceModel.findOne({ page }).exec();
  }

  async updateByPage(updateDto: UpdateServiceDto): Promise<Service> {
    const { page, ...dataToUpdate } = updateDto;
    const existing = await this.findByPage(page!);
    
    if (existing) {
      Object.assign(existing, dataToUpdate);
      return existing.save();
    } else {
      return this.create(updateDto);
    }
  }

  async delete(page: string): Promise<void> {
    await this.serviceModel.deleteOne({ page }).exec();
  }
}
