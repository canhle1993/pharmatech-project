import { IsNotEmpty, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CareerDTO } from 'src/career/career.dto';

/** 📥 DTO dùng để save job */
export class SaveJobDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  job_id: string;
}

/** 📤 DTO trả về */
export class SavedJobDTO {
  @Expose()
  _id: string;

  @Expose()
  user_id: string;

  @Expose()
  @Type(() => CareerDTO)
  job_id: CareerDTO; // sẽ populate Career info

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
