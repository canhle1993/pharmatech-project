import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CareerAnalytics, CareerAnalyticsSchema } from './analytics.decorator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CareerAnalytics.name, schema: CareerAnalyticsSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class CareerAnalyticsModule {}
