import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHotlineDto, UpdateHotlineDto } from './hotline.dto';
import { Hotline } from './hotline.schema';

@Injectable()
export class HotlineService {
  constructor(
    @InjectModel(Hotline.name)
    private hotlineModel: Model<Hotline>,
  ) {}

  async findAll(): Promise<Hotline> {
    return this.hotlineModel.findOne().exec();
  }

  async create(createDto: CreateHotlineDto): Promise<Hotline> {
    const created = new this.hotlineModel(createDto);
    return created.save();
  }

  async update(id: string, updateDto: UpdateHotlineDto): Promise<Hotline> {
    return this.hotlineModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }
}
