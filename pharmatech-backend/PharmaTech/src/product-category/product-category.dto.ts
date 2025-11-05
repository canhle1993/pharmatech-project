import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProductCategoryDTO {
  @IsNotEmpty()
  @IsString()
  product_id: string;

  @IsNotEmpty()
  @IsString()
  category_id: string;

  @IsOptional()
  @IsString()
  updated_by?: string;
}
