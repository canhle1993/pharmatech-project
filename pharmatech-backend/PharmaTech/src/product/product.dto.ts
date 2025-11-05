import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class ProductDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  name: string;

  @Expose()
  model?: string;

  @Expose()
  description?: string;

  @Expose()
  specification?: string;

  @Transform(({ obj }) => (obj?.price ? Number(obj.price) : 0))
  @Expose()
  price?: number;

  @Expose()
  manufacturer?: string;

  @Transform(({ obj }) => (obj?.photo ? `${getImageUrl()}${obj.photo}` : null))
  @Expose()
  photo?: string | null;

  /** ✅ Danh sách category mà sản phẩm thuộc về */
  @Expose({ name: 'category_ids' })
  category_ids?: string[];

  /** ✅ Nếu service populate categories ra luôn (dạng object) */
  @Expose()
  categories?: any[];

  @Expose({ name: 'is_active' })
  is_active: boolean;

  @Expose({ name: 'is_delete' })
  is_delete: boolean;

  @Expose({ name: 'updated_by' })
  updated_by?: string;

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

  constructor(partial: Partial<ProductDTO>) {
    Object.assign(this, partial);
  }
}
