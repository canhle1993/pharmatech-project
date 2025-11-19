import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ default: '' })
  slide1: string;

  @Prop({ default: '' })
  slide2: string;

  @Prop({ default: '' })
  slide3: string;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
