import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './account.decorator';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Account.name,
        schema: AccountSchema,
      },
    ]),
  ],
  providers: [AccountService, MailService],
  controllers: [AccountController],
  exports: [AccountService, MailService],
})
export class AccountModule {}
