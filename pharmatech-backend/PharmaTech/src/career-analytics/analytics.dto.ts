import { Expose } from 'class-transformer';

export class ApplicationAnalyticsDTO {
  @Expose()
  id: string;

  @Expose()
  application_id: string;

  @Expose()
  account_id: string;

  @Expose()
  career_id: string;

  @Expose()
  age?: number;

  @Expose()
  age_range?: string;

  @Expose()
  gender?: string;

  @Expose()
  skills?: string[];

  @Expose()
  languages?: string[];

  @Expose()
  career_title?: string;

  @Expose()
  career_department?: string;

  @Expose()
  status?: string;

  @Expose()
  result?: string;

  @Expose()
  applied_date?: Date;

  @Expose()
  reviewed_date?: Date;

  @Expose()
  interview_date?: Date;

  @Expose()
  hired_start_date?: Date;

  @Expose()
  expected_salary?: number;

  @Expose()
  updated_at?: Date;
}
