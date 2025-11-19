import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Service extends Document {
  @Prop({ required: true, unique: true })
  page: string; // consulting, technical-support, equipment-upgrade, maintenance

  @Prop()
  bannerImage: string;

  @Prop()
  content: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
