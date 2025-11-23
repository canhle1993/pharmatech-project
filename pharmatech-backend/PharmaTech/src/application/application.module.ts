import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './application.decorator';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { MailModule } from 'src/mail/mail.module';
import { CareerAnalyticsModule } from 'src/career-analytics/analytics.module';
import { ApplicationGateway } from './application.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    MailModule,
    CareerAnalyticsModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationGateway],
})
export class ApplicationModule {}
