import { IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateServiceDto extends CreateServiceDto {}
