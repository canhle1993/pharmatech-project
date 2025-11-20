import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';

export class DepositSettingDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  /** type: "range" | "default" */
  @Expose()
  type: 'range' | 'default';

  /** Fields for RANGE type */
  @Expose()
  min_total?: number;

  @Expose()
  max_total?: number;

  @Expose()
  percent?: number;

  /** Field for DEFAULT type */
  @Expose()
  default_percent?: number;

  @Expose()
  is_active: boolean;

  @Expose()
  is_delete: boolean;

  @Expose()
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

  constructor(partial: Partial<DepositSettingDTO>) {
    Object.assign(this, partial);
  }
}
