import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Hotline extends Document {
  @Prop({ required: true })
  hotlineNumber: string;

  @Prop({ required: true })
  storeLocation: string;
}

export const HotlineSchema = SchemaFactory.createForClass(Hotline);
