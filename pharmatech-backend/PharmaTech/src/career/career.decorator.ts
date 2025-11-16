import * as mongoose from 'mongoose';

export class Career extends mongoose.Document {
  title: string;
  department: string;
  location: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  banner?: string;
  posted_by: string;

  quantity?: number;
  level?: string;
  experience?: string;
  min_experience?: string;
  education_level?: string;
  work_type?: string;
  working_hours?: string;
  working_days?: string;
  area?: string;
  industry?: string[];
  field?: string[];
  age_range?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  language?: string[];
  skills?: string[];

  benefits?: string[];

  posted_date?: Date;
  expiration_date?: Date;

  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export const CareerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    salary_range: { type: String },
    banner: { type: String },
    posted_by: { type: String, required: true },

    quantity: { type: Number },
    level: { type: String },
    experience: { type: String },
    min_experience: { type: String },
    education_level: { type: String },
    work_type: { type: String },
    working_hours: { type: String },
    working_days: { type: String },
    area: { type: String },
    industry: [{ type: String }],
    field: [{ type: String }],
    age_range: { type: String },
    gender: { type: String },
    nationality: { type: String },
    marital_status: { type: String },
    language: [{ type: String }],
    skills: [{ type: String }],

    benefits: [{ type: String }],

    posted_date: { type: Date },
    expiration_date: { type: Date },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
  },
  { collection: 'careers' },
);
