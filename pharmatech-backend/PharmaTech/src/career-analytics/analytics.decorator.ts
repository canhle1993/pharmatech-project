import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'career_analytics' })
export class CareerAnalytics extends Document {
  /** 🔗 Relationship Keys */
  @Prop({ required: true })
  application_id: string;

  @Prop({ required: true })
  account_id: string;

  @Prop({ required: true })
  career_id: string;

  /** 👤 Candidate Info */
  @Prop()
  age?: number;

  @Prop()
  age_range?: string;

  @Prop()
  gender?: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  /** 💼 Career Info */
  @Prop()
  career_title?: string;

  @Prop()
  career_department?: string;

  /** ⏳ Process status */
  @Prop()
  status?: string;

  @Prop()
  result?: string;

  @Prop()
  applied_date?: Date;

  @Prop()
  reviewed_date?: Date;

  @Prop()
  interview_date?: Date;

  @Prop()
  hired_start_date?: Date;

  /** 💰 Salary */
  @Prop()
  expected_salary?: number;

  /** 🕒 Last updated */
  @Prop({ default: Date.now })
  updated_at: Date;
}

export type CareerAnalyticsDocument = CareerAnalytics & Document;
export const CareerAnalyticsSchema =
  SchemaFactory.createForClass(CareerAnalytics);
