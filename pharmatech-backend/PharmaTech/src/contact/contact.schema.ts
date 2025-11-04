import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema()
export class Contact {
  @Prop({ required: true })
  content: string;

  @Prop()
  bannerImage?: string;

  @Prop({ type: [String], default: [] })
  addresses?: string[];

  @Prop({ type: [String], default: [] })
  phones?: string[];

  @Prop({ type: [String], default: [] })
  emails?: string[];

  @Prop()
  mapUrl?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
