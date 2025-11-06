import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeCategorySchema } from './homeCategory.decorator';
import { HomeCategoryService } from './homeCategory.service';
import { HomeCategoryController } from './homeCategory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'HomeCategory', schema: HomeCategorySchema },
    ]),
  ],
  controllers: [HomeCategoryController],
  providers: [HomeCategoryService],
  exports: [HomeCategoryService],
})
export class HomeCategoryModule {}
