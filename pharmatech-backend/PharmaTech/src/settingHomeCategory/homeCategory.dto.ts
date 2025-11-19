import { IsMongoId, IsNotEmpty } from 'class-validator';

export class HomeCategoryDTO {
  @IsMongoId()
  @IsNotEmpty()
  category1: string;

  @IsMongoId()
  @IsNotEmpty()
  category2: string;

  @IsMongoId()
  @IsNotEmpty()
  category3: string;
}
