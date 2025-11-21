import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase } from './purchase.schema';
import { CreatePurchaseDto, UpdatePurchaseDto } from './purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
  ) {}

  async create(createDto: CreatePurchaseDto): Promise<Purchase> {
    const created = new this.purchaseModel(createDto);
    return created.save();
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseModel.find().exec();
  }

  async findByPage(page: string): Promise<Purchase | null> {
    return this.purchaseModel.findOne({ page }).exec();
  }

  async updateByPage(updateDto: UpdatePurchaseDto): Promise<Purchase> {
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
    await this.purchaseModel.deleteOne({ page }).exec();
  }
}
