// src/application/application.dto.ts
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from '../account/config.util';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

/** ==========================
 * 🧾 DTO DÙNG CHO OUTPUT (RESPONSE)
 ========================== */
export class ApplicationDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose()
  id: string;

  @Expose()
  account_id: string;

  @Expose()
  career_id: string;

  @Transform(({ obj }) =>
    obj?.resume ? `${getImageUrl()}${obj.resume}` : null,
  )
  @Expose()
  resume?: string | null;

  @Expose() cover_letter?: string;
  @Expose() portfolio?: string;
  @Expose() expected_salary?: number;
  @Expose() available_from?: Date;
  @Expose() status?: string;
  @Expose() note?: string;

  /** 🧩 SuperAdmin assignment */
  @Expose() assigned_admin_id?: string;
  @Expose() assigned_admin_name?: string;
  @Transform(({ obj }) =>
    obj?.assigned_at
      ? moment(obj.assigned_at).format('DD/MM/YYYY HH:mm')
      : null,
  )
  @Expose()
  assigned_at?: string | null;

  /** 🗓️ Interview info */
  @Transform(({ obj }) =>
    obj?.interview_date
      ? moment(obj.interview_date).format('DD/MM/YYYY HH:mm')
      : null,
  )
  @Expose()
  interview_date?: string | null;

  @Expose() interview_location?: string;
  @Expose() interview_email_content?: string;

  /** 🧾 Result */
  @Expose() result?: string;
  @Expose() hired_start_date?: Date;
  @Expose() hired_department?: string;
  @Expose() email_sent?: boolean;

  /** 🕒 Timestamp */
  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose()
  created_at?: string | null;

  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose()
  updated_at?: string | null;
}

/** ==========================
 * 🧩 DTO DÙNG CHO INPUT (CREATE REQUEST)
 ========================== */
export class CreateApplicationDto {
  @IsNotEmpty()
  @IsString()
  account_id: string;

  @IsNotEmpty()
  @IsString()
  career_id: string;

  @IsOptional()
  @IsString()
  resume?: string;

  @IsOptional()
  @IsString()
  cover_letter?: string;

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsOptional()
  @IsNumber()
  expected_salary?: number;

  @IsOptional()
  @IsDateString()
  available_from?: Date;
}
