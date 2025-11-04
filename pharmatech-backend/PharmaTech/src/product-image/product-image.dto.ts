import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';

export class ProductImageDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  product_id: string;

  @Expose()
  url: string;

  @Expose()
  caption?: string;

  @Expose()
  is_main?: boolean;

  @Expose()
  updated_by?: string;

  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string;

  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string;
}
