import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { Quote, QuoteSchema } from './quote.schema';
import { MailModule } from '../mail/mail.module';
import { QuoteGateway } from './quote.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    forwardRef(() => MailModule),
  ],
  controllers: [QuoteController],
  providers: [QuoteService, QuoteGateway],
  exports: [QuoteService],
})
export class QuoteModule {}
