import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepositSettingDocument = HydratedDocument<DepositSetting>;

@Schema({
  collection: 'deposit_settings',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class DepositSetting {
  /** Loại cấu hình:
   *  "range" → áp dụng theo min/max (dùng trong bảng)
   *  "default" → cấu hình % mặc định
   */
  @Prop({ required: true, enum: ['range', 'default'] })
  type: 'range' | 'default';

  @Prop()
  min_total?: number;

  @Prop()
  max_total?: number;

  @Prop()
  percent?: number;

  @Prop()
  default_percent?: number; // chỉ có khi type = 'default'

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_delete: boolean;

  @Prop()
  updated_by?: string;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const DepositSettingSchema =
  SchemaFactory.createForClass(DepositSetting);
