import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHotlineDto {
  @IsNotEmpty()
  @IsString()
  hotlineNumber: string;

  @IsNotEmpty()
  @IsString()
  storeLocation: string;
}

export class UpdateHotlineDto {
  @IsOptional()
  @IsString()
  hotlineNumber?: string;

  @IsOptional()
  @IsString()
  storeLocation?: string;
}
