import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerSchema } from './career.decorator';
import { Account, AccountSchema } from 'src/account/account.decorator';
import { MailModule } from 'src/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailModule, // cho phép inject MailService
    MongooseModule.forFeature([
      { name: 'Career', schema: CareerSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
