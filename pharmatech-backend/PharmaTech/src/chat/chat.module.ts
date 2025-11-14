import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateWay } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatThreadMessage, ChatThreadMessageSchema } from './chat.schema';
import { Inbox, InboxSchema } from './inbox.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatThreadMessage.name, schema: ChatThreadMessageSchema },
      { name: Inbox.name, schema: InboxSchema },
    ]),
  ],
  providers: [ChatService, ChatGateWay],
  exports: [ChatService],
})
export class ChatModule {}
