import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Account extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  address?: string;

  @Prop()
  gender?: string;

  @Prop()
  dob?: Date;

  @Prop()
  photo?: string;

  @Prop()
  username?: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_delete: boolean;

  @Prop()
  securityCode?: string;

  @Prop({ type: Date, default: null })
  otpExpiredAt?: Date;

  @Prop()
  last_login?: Date;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;

  // 🎓 Học vấn
  @Prop({
    type: {
      education_level: String,
      major: String,
      school_name: String,
      graduation_year: Number,
    },
  })
  education?: {
    education_level?: string;
    major?: string;
    school_name?: string;
    graduation_year?: number;
  };

  // 💼 Kinh nghiệm
  @Prop({
    type: {
      company_name: String,
      job_title: String,
      working_years: Number,
      responsibilities: String,
    },
  })
  experience?: {
    company_name?: string;
    job_title?: string;
    working_years?: number;
    responsibilities?: string;
  };

  // 🧠 Kỹ năng & Ngôn ngữ
  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ type: [String], default: [] })
  languages?: string[];

  // 🌐 Lĩnh vực chuyên môn
  @Prop({ type: [String], default: [] })
  field?: string[];

  // 🏙️ Khu vực mong muốn
  @Prop()
  preferred_area?: string;

  @Prop()
  resume?: string;

  @Prop()
  introduction?: string;

  @Prop()
  expected_salary?: number;

  @Prop()
  job_type?: string;

  @Prop()
  available_from?: Date;
  @Prop({ type: Number, default: 0 })
  failedAttempts?: number;

  @Prop({ type: Date, default: null })
  lockedUntil?: Date | null;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
