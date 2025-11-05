import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatThreadMessageDocument = HydratedDocument<ChatThreadMessage>;
export type ChatRole = 'user' | 'admin';

@Schema({ collection: 'chat_thread_messages', timestamps: { createdAt: true, updatedAt: false } })
export class ChatThreadMessage {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['user', 'admin'], index: true })
  fromRole: ChatRole;

  @Prop({ required: true })
  msg: string;

  createdAt: Date;
}

export const ChatThreadMessageSchema = SchemaFactory.createForClass(ChatThreadMessage);
ChatThreadMessageSchema.index({ userId: 1, createdAt: -1 });
