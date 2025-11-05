// src/career/career.dto.ts
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from '../account/config.util';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
<<<<<<< HEAD
  IsArray,
=======
>>>>>>> origin/main
} from 'class-validator';

//
// 🟢 DTO dùng khi tạo bài đăng
//
export class CreateCareerDto {
<<<<<<< HEAD
  // --- Thông tin cơ bản ---
=======
>>>>>>> origin/main
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsString() department: string;
  @IsNotEmpty() @IsString() location: string;
  @IsNotEmpty() @IsString() description: string;

  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @IsString() salary_range?: string;
  @IsOptional() @IsString() banner?: string;
  @IsNotEmpty() @IsString() posted_by: string;

<<<<<<< HEAD
  // --- Thông tin chi tiết tuyển dụng ---
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() experience?: string;
  @IsOptional() @IsString() min_experience?: string;
  @IsOptional() @IsString() education_level?: string;
  @IsOptional() @IsString() work_type?: string;
  @IsOptional() @IsString() working_hours?: string;
  @IsOptional() @IsString() working_days?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) industry?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) field?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) language?: string[];
  @IsOptional() @IsString() age_range?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() marital_status?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) benefits?: string[];

  // --- Ngày đăng / hết hạn ---
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  posted_date?: Date;

=======
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() experience?: string;
  @IsOptional() @IsString() work_type?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  posted_date?: Date;
>>>>>>> origin/main
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  expiration_date?: Date;
}

//
// 🟡 DTO dùng khi cập nhật bài đăng
//
export class UpdateCareerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @IsString() salary_range?: string;
  @IsOptional() @IsString() banner?: string;
<<<<<<< HEAD
  @IsOptional() @IsString() posted_by?: string;
=======
>>>>>>> origin/main

  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() experience?: string;
<<<<<<< HEAD
  @IsOptional() @IsString() min_experience?: string;
  @IsOptional() @IsString() education_level?: string;
  @IsOptional() @IsString() work_type?: string;
  @IsOptional() @IsString() working_hours?: string;
  @IsOptional() @IsString() working_days?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) industry?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) field?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) language?: string[];
  @IsOptional() @IsString() age_range?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() marital_status?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) benefits?: string[];
=======
  @IsOptional() @IsString() work_type?: string;
  @IsOptional() @IsString() area?: string;
>>>>>>> origin/main

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  posted_date?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  expiration_date?: Date;
}

//
// 🔵 DTO hiển thị dữ liệu trả về
//
export class CareerDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose() title: string;
  @Expose() department: string;
  @Expose() location: string;
  @Expose() description: string;
  @Expose() requirements?: string;
  @Expose() salary_range?: string;

<<<<<<< HEAD
  @Transform(({ obj }) => {
    if (!obj?.banner) return null;
    if (obj.banner.startsWith('http')) return obj.banner;
    return `${getImageUrl()}/career-banners/${obj.banner}`;
  })
=======
  @Transform(({ obj }) =>
    obj?.banner ? `${getImageUrl()}/career-banners/${obj.banner}` : null,
  )
>>>>>>> origin/main
  @Expose()
  banner?: string | null;

  @Expose({ name: 'posted_by' }) posted_by: string;
  @Expose({ name: 'is_active' }) is_active: boolean;

<<<<<<< HEAD
  // --- Chi tiết tuyển dụng ---
  @Expose() quantity?: number;
  @Expose() level?: string;
  @Expose() experience?: string;
  @Expose() min_experience?: string;
  @Expose() education_level?: string;
  @Expose() work_type?: string;
  @Expose() working_hours?: string;
  @Expose() working_days?: string;
  @Expose() area?: string;
  @Expose() industry?: string[];
  @Expose() field?: string[];
  @Expose() language?: string[];
  @Expose() age_range?: string;
  @Expose() gender?: string;
  @Expose() nationality?: string;
  @Expose() marital_status?: string;
  @Expose() skills?: string[];
  @Expose() benefits?: string[];

  // --- Ngày đăng / hết hạn / tạo / cập nhật ---
=======
  // 🆕
  @Expose() quantity?: number;
  @Expose() level?: string;
  @Expose() experience?: string;
  @Expose() work_type?: string;
  @Expose() area?: string;

>>>>>>> origin/main
  @Transform(({ obj }) =>
    obj?.posted_date ? moment(obj.posted_date).format('YYYY-MM-DD') : null,
  )
  @Expose()
  posted_date?: string | null;

  @Transform(({ obj }) =>
    obj?.expiration_date
      ? moment(obj.expiration_date).format('YYYY-MM-DD')
      : null,
  )
  @Expose()
  expiration_date?: string | null;

  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string | null;

  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string | null;

  constructor(partial: Partial<CareerDTO>) {
    Object.assign(this, partial);
  }
}
