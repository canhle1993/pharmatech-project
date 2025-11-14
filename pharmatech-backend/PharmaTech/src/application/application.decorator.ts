// src/application/application.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'applications',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Application extends Document {
  // 🔗 Liên kết
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  account_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Career', required: true })
  career_id: string;

  // 📄 Thông tin hồ sơ nộp
  @Prop()
  resume?: string;

  @Prop()
  cover_letter?: string;

  @Prop()
  portfolio?: string;

  @Prop()
  expected_salary?: number;

  @Prop()
  available_from?: Date;

  // 🧠 Trạng thái xử lý
  @Prop({ default: 'pending' })
  status: string; // pending | assigned | interview | hired | rejected

  @Prop()
  reviewed_date?: Date;

  @Prop()
  note?: string;

  // 👑 SuperAdmin phân công Admin
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', default: null })
  assigned_admin_id?: string;

  @Prop({ type: String, default: null })
  assigned_admin_name?: string;

  @Prop({ type: Date })
  assigned_at?: Date;

  // 🗓️ Lên lịch phỏng vấn
  @Prop({ type: Date })
  interview_date?: Date;

  @Prop({ type: String })
  interview_location?: string;

  @Prop({ type: String })
  interview_email_content?: string;

  // 📧 Email đã gửi chưa
  @Prop({ type: Boolean, default: false })
  email_sent?: boolean;

  // 🧾 Kết quả phỏng vấn
  @Prop({ type: String })
  result?: string; // pass | fail | pending

  @Prop({ type: Date })
  hired_start_date?: Date;

  @Prop({ type: String })
  hired_department?: string;

  // Thời gian tạo / cập nhật
  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
