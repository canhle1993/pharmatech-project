import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AboutService } from './about.service';
import { AboutController } from './about.controller';
import { About, AboutSchema } from './about.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: About.name, schema: AboutSchema },
    ]),
  ],
  providers: [AboutService],
  controllers: [AboutController],
  exports: [AboutService],
})
export class AboutModule {}
