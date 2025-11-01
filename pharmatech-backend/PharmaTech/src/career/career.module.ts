import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerSchema } from './career.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Career', schema: CareerSchema }]),
  ],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
