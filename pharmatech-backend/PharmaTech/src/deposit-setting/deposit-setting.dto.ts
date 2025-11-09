import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';

export class DepositSettingDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  min_total: number; // 💰 Tổng tiền tối thiểu áp dụng

  @Expose()
  max_total: number; // 💰 Tổng tiền tối đa áp dụng

  @Expose()
  percent: number; // 📊 Phần trăm đặt cọc tương ứng (VD: 30%)

  @Expose()
  is_active: boolean; // ✅ Cấu hình có đang được áp dụng không

  @Expose()
  is_delete: boolean; // 🗑️ Xóa mềm

  @Expose()
  updated_by?: string; // 👤 Người cập nhật cuối cùng

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
