import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { buildImageUrl } from '../order/config.util';

export class OrderDetailsDTO {
  @Expose() id: string;

  /** 🔗 Order & Product */
  @Expose() order_id: string;
  @Expose() product_id: string;

  /** 🧾 Snapshot */
  @Expose() product_name: string;
  @Expose() product_model?: string;

  /** 📸 Ảnh đầy đủ URL (DTO build) */
  @Expose()
  @Transform(({ value }) => buildImageUrl(value))
  product_photo?: string;

  /** 💰 Giá & SL */
  @Expose() unit_price: number;
  @Expose() quantity: number;
  @Expose() total_price: number;

  /** 📦 Trạng thái sản phẩm trong đơn */
  @Expose() status: string;

  /** ⚙️ System */
  @Expose() is_active: boolean;
  @Expose() is_delete: boolean;
  @Expose() updated_by?: string;

  /** 🕓 Time */
  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  created_at?: string;

  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  updated_at?: string;
}
