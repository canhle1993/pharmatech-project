import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HotlineController } from './hotline.controller';
import { Hotline, HotlineSchema } from './hotline.schema';
import { HotlineService } from './hotline.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Hotline.name, schema: HotlineSchema }]),
  ],
  controllers: [HotlineController],
  providers: [HotlineService],
})
export class HotlineModule {}
