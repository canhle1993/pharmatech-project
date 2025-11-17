import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from 'src/order/config.util';

export class ReturnRequestDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  order_id: string;

  @Expose()
  user_id: string;

  /** 📦 Danh sách item lỗi (snapshot) */
  @Expose()
  items?: {
    order_detail_id: string;
    product_id: string;
    product_name: string;
    product_model?: string;
    product_photo?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];

  /** 🧺 Sản phẩm mới dùng để đổi */
  @Expose()
  replacement_product_id: string;

  @Expose()
  replacement_product_name?: string;

  @Expose()
  replacement_product_model?: string;

  @Expose()
  @Transform(({ obj }) =>
    obj?.replacement_product_photo
      ? obj.replacement_product_photo.startsWith('http')
        ? obj.replacement_product_photo
        : `${getImageUrl()}${obj.replacement_product_photo}`
      : null,
  )
  replacement_product_photo?: string | null;

  @Expose()
  replacement_unit_price?: number;

  /** 🔢 Tổng số lượng đổi */
  @Expose()
  total_quantity: number;

  /** 📝 Lý do */
  @Expose()
  reason?: string;

  /** 📎 Ảnh minh chứng (trả về full URL) */
  @Expose()
  @Transform(({ obj }) =>
    Array.isArray(obj?.damage_photos)
      ? obj.damage_photos.map((f: string) =>
          f?.startsWith('http') ? f : `${getImageUrl()}${f}`,
        )
      : [],
  )
  damage_photos?: string[];

  /** 📦 Trạng thái */
  @Expose()
  status: string;

  /** ⚙️ System */
  @Expose()
  is_active: boolean;

  @Expose()
  is_delete: boolean;

  @Expose()
  updated_by?: string;

  /** 🕓 Time */
  @Expose()
  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  created_at?: string | null;

  @Expose()
  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  updated_at?: string | null;

  constructor(partial: Partial<ReturnRequestDTO>) {
    Object.assign(this, partial);
  }
}
