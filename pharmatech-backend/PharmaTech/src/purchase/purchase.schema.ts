import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Purchase extends Document {
  @Prop({ required: true, unique: true })
  page: string; // customer-intake, technical-consulting, urs-development, contract-signing

  @Prop()
  bannerImage: string;

  @Prop()
  content: string;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
