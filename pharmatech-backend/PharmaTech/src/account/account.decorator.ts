import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'accounts',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Account extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  gender?: string;

  @Prop()
  photo?: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  securityCode?: string;

  @Prop({ default: 0 })
  failedAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop({ default: false })
  is_delete: boolean;

  @Prop()
  last_login?: Date;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
