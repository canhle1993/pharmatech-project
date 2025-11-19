import { IsOptional, IsString } from 'class-validator';

export class CreatePurchaseDto {
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

export class UpdatePurchaseDto extends CreatePurchaseDto {}
