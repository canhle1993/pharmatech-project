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

  @Prop({ unique: true, sparse: true })
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

  // 🧑‍🎓 Học vấn
  @Prop({
    type: {
<<<<<<< HEAD
      degree: { type: String },
      university: { type: String },
      graduation_year: { type: Number },
    },
    _id: false, // không tạo ObjectId con
  })
  education?: {
=======
      degree: { type: String, default: '' },
      university: { type: String, default: '' },
      graduation_year: { type: Number, default: null },
    },
    default: {},  // 👈 thêm dòng này
    _id: false,
  })
  education: {
>>>>>>> origin/main
    degree?: string;
    university?: string;
    graduation_year?: number;
  };

  // 💼 Kinh nghiệm
  @Prop({
    type: {
<<<<<<< HEAD
      company: { type: String },
      position: { type: String },
      years: { type: Number },
    },
    _id: false,
  })
  experience?: {
=======
      company: { type: String, default: '' },
      position: { type: String, default: '' },
      years: { type: Number, default: null },
    },
    default: {},  // 👈 thêm dòng này
    _id: false,
  })
  experience: {
>>>>>>> origin/main
    company?: string;
    position?: string;
    years?: number;
  };

  // 📄 File Resume
  @Prop()
  resume?: string;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
