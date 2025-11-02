// src/career/career.dto.ts
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from '../account/config.util';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

//
// 🟢 DTO dùng khi tạo bài đăng
//
export class CreateCareerDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsString() department: string;
  @IsNotEmpty() @IsString() location: string;
  @IsNotEmpty() @IsString() description: string;
  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @IsString() salary_range?: string;
  @IsOptional() @IsString() banner?: string;
  @IsNotEmpty() @IsString() posted_by: string;
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
}

//
// 🔵 DTO hiển thị dữ liệu trả về (giống account.dto.ts)
//
export class CareerDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  title: string;

  @Expose()
  department: string;

  @Expose()
  location: string;

  @Expose()
  description: string;

  @Expose()
  requirements?: string;

  @Expose()
  salary_range?: string;

  @Transform(({ obj }) =>
    obj?.banner ? `${getImageUrl()}/career-banners/${obj.banner}` : null,
  )
  @Expose()
  banner?: string | null;

  @Expose({ name: 'posted_by' })
  posted_by: string;

  @Expose({ name: 'is_active' })
  is_active: boolean;

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
