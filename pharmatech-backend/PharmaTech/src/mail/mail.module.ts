import { Module, forwardRef } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { QuoteModule } from '../quote/quote.module';

@Module({
  imports: [forwardRef(() => QuoteModule)],
  providers: [MailService],
  controllers: [MailController],
  exports: [
    MailService
  ]
})
export class MailModule {}
