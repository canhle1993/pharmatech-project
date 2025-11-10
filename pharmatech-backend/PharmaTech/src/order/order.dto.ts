import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { buildImageUrl } from './config.util';

export class OrderDTO {
  @Expose()
  id: string;

  /** 🧍 Thông tin người dùng */
  @Expose()
  user_id: string;

  /** 🧾 Billing info */
  @Expose()
  contact_name: string;

  @Expose()
  contact_email: string;

  @Expose()
  contact_phone: string;

  @Expose()
  contact_address: string;

  /** 💰 Tổng giá trị đơn hàng */
  @Expose()
  total_amount: number;

  /** 💵 Phần trăm và số tiền đặt cọc */
  @Expose()
  deposit_percent: number;

  @Expose()
  deposit_amount: number;

  /** 💳 Số tiền còn lại */
  @Expose()
  remaining_payment_amount: number;

  @Expose()
  remaining_payment_method?: string;

  /** 🗓️ Ngày thanh toán phần còn lại */
  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  remaining_payment_date?: string;

  @Expose()
  remaining_payment_note?: string;

  /** 🧾 Hóa đơn & biên lai */
  @Expose()
  @Transform(({ value }) => buildImageUrl(value))
  payment_proof_url?: string;

  @Expose()
  paypal_order_id?: string;

  @Expose()
  payment_id?: string;

  @Expose()
  refund_id?: string;

  /** 💳 Phương thức thanh toán */
  @Expose()
  payment_method?: string;

  /** 📦 Trạng thái đơn hàng */
  @Expose()
  status: string;

  @Expose()
  approval_status: string;

  @Expose()
  refund_status: string;

  /** 🕓 Mốc thời gian */
  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  paid_at?: string;

  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  cancelled_at?: string;

  @Expose()
  cancel_reason?: string;

  @Expose()
  @Transform(({ value }) =>
    value ? moment(value).format('DD/MM/YYYY HH:mm') : null,
  )
  refund_time?: string;

  /** 🧩 Danh sách sản phẩm tóm tắt */
  @Expose()
  items?: any[];

  /** ⚙️ Trạng thái hệ thống */
  @Expose()
  is_active: boolean;

  @Expose()
  is_delete: boolean;

  /** 👨‍💻 Người cập nhật gần nhất */
  @Expose()
  updated_by?: string;

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
