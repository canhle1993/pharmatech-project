import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatThreadMessage, ChatThreadMessageDocument } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatThreadMessage.name)
    private readonly msgModel: Model<ChatThreadMessageDocument>,
  ) {}

  saveToThread(params: { userId: string; fromRole: string; msg: string }) {
    const doc = new this.msgModel(params);
    return doc.save();
  }

  loadThread(userId: string, limit = 100) {
    return this.msgModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }
}
