import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InboxDocument = HydratedDocument<Inbox>;

/** Một doc cho mỗi cặp (adminId, userId) */
@Schema({ collection: 'chat_inbox', timestamps: true })
export class Inbox {
  @Prop({ required: true, index: true })
  adminId: string;           // nếu 1 admin cũng cứ lưu để mở rộng

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: {
      text: String,
      fromId: String,        // id người gửi (user/admin)
      createdAt: Date
    },
    default: null
  })
  lastMessage: { text: string; fromId: string; createdAt: Date } | null;

  @Prop({ type: Date, index: true })
  lastMessageAt: Date;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;       // số tin chưa đọc đối với admin

  @Prop({ type: Boolean, default: false })
  archived: boolean;

  // để giảm join (tùy): lưu snapshot tên/trạng thái user
  @Prop({ type: Object, default: null })
  userSnapshot?: any;
}

export const InboxSchema = SchemaFactory.createForClass(Inbox);
// Index phục vụ sort + unique cặp
// db.chat_inbox.createIndex({ adminId: 1, userId: 1 }, { unique: true })
// db.chat_inbox.createIndex({ adminId: 1, lastMessageAt: -1 })
