import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  createdAt?: Date;
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  repliedAt?: Date;

  @IsOptional()
  @IsString()
  replyMessage?: string;
}

export class ReplyQuoteDto {
  @IsString()
  @IsNotEmpty()
  replyMessage: string;
}

export class FilterQuoteDto {
  @IsOptional()
  @IsString()
  @IsIn(['unread', 'read', 'replied'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
