import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaveJobController } from './savejob.controller';
import { SaveJobService } from './savejob.service';
import { SavedJob, SavedJobSchema } from './savejob.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedJob.name, schema: SavedJobSchema },
    ]),
  ],
  controllers: [SaveJobController],
  providers: [SaveJobService],
})
export class SaveJobModule {}
