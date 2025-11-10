import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatThreadMessage, ChatThreadMessageDocument } from './chat.schema';
import { Inbox, InboxDocument } from './inbox.schema';

@Injectable()
export class ChatService {
  // Nếu chỉ có 1 admin: set ở ENV hoặc hằng số
  private readonly ADMIN_ID = process.env.ADMIN_ID || 'ADMIN_DEFAULT_ID';

  constructor(
    @InjectModel(ChatThreadMessage.name)
    private readonly msgModel: Model<ChatThreadMessageDocument>,

    @InjectModel(Inbox.name)
    private readonly inboxModel: Model<InboxDocument>,
  ) {}

  /** --- MESSAGES --- */

  saveToThread(params: { userId: string; fromRole: string; msg: string }) {
    const doc = new this.msgModel(params);
    return doc.save();
  }

  loadThread(userId: string, limit = 100) {
    return this.msgModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** --- INBOX HELPERS --- */

  /** Tin đến từ USER -> tăng unread cho admin + cập nhật lastMessage */
  async upsertInboxOnIncomingFromUser(userId: string, text: string, fromId: string, createdAt: Date) {
    const adminId = this.ADMIN_ID;
    const updated = await this.inboxModel.findOneAndUpdate(
      { adminId, userId },
      {
        $set: {
          lastMessage: { text, fromId, createdAt },
          lastMessageAt: createdAt,
          archived: false,
        },
        $inc: { unreadCount: 1 },
      },
      { new: true, upsert: true }
    );
    return updated;
  }

  /** Tin từ ADMIN -> chỉ cập nhật lastMessage (không tăng unread của admin) */
  async upsertInboxOnOutgoingFromAdmin(userId: string, text: string, fromId: string, createdAt: Date) {
    const adminId = this.ADMIN_ID;
    const updated = await this.inboxModel.findOneAndUpdate(
      { adminId, userId },
      {
        $set: {
          lastMessage: { text, fromId, createdAt },
          lastMessageAt: createdAt,
          archived: false,
        },
      },
      { new: true, upsert: true }
    );
    return updated;
  }

  /** Clear unread khi admin đã đọc thread userId */
  async markRead(userId: string) {
    const adminId = this.ADMIN_ID;
    const updated = await this.inboxModel.findOneAndUpdate(
      { adminId, userId },
      { $set: { unreadCount: 0 } },
      { new: true }
    );
    return updated;
  }

  /** Sidebar: lấy inbox (để render list) */
  async listInbox(limit = 50, cursor?: string) {
    const adminId = this.ADMIN_ID;
    const query: any = { adminId, archived: { $ne: true } };
    if (cursor) {
      // cursor là ISO date string/number; lấy những item trước đó
      query.lastMessageAt = { $lt: new Date(cursor) };
    }
    return this.inboxModel
      .find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
