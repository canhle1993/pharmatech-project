import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './application.decorator';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    MailModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
