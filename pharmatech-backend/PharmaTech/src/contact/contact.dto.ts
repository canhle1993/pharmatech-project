import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  addresses?: string[] | string;

  @IsOptional()
  phones?: string[] | string;

  @IsOptional()
  emails?: string[] | string;

  @IsOptional()
  @IsString()
  mapUrl?: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  addresses?: string[] | string;

  @IsOptional()
  phones?: string[] | string;

  @IsOptional()
  emails?: string[] | string;

  @IsOptional()
  @IsString()
  mapUrl?: string;
}
