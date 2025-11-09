import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepositSettingDocument = HydratedDocument<DepositSetting>;

@Schema({
  collection: 'deposit_settings', // ✅ Tên collection trong MongoDB
  versionKey: false, // ❌ Tắt field __v
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DepositSetting {
  @Prop({ required: true })
  min_total: number; // 💰 Tổng tiền tối thiểu áp dụng (VD: 0)

  @Prop({ required: true })
  max_total: number; // 💰 Tổng tiền tối đa áp dụng (VD: 10_000_000)

  @Prop({ required: true })
  percent: number; // 📊 Phần trăm đặt cọc tương ứng (VD: 30)

  @Prop({ default: true })
  is_active: boolean; // ✅ Cấu hình có đang được áp dụng không

  @Prop({ default: false })
  is_delete: boolean; // 🗑️ Xóa mềm

  @Prop()
  updated_by?: string; // 👤 Người cập nhật cuối cùng

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const DepositSettingSchema =
  SchemaFactory.createForClass(DepositSetting);
