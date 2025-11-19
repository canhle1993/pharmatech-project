import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class OrderDTO {
  @Expose()
  id: string;

  /** 🧍 Thông tin người dùng */
  @Expose()
  user_id: string;

  // 🆕 Thông tin account đặt hàng (lấy từ bảng Account)
  @Expose()
  user_info?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

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
  @Transform(({ value }) =>
    typeof value === 'number' ? Number(value.toFixed(2)) : 0,
  )
  total_amount: number;

  /** 💵 Phần trăm và số tiền đặt cọc */
  @Expose()
  deposit_percent: number;

  @Expose()
  @Transform(({ value }) =>
    typeof value === 'number' ? Number(value.toFixed(2)) : 0,
  )
  deposit_amount: number;

  /** 💳 Số tiền còn lại */
  @Expose()
  @Transform(({ value }) =>
    typeof value === 'number' ? Number(value.toFixed(2)) : 0,
  )
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

  /** 🧾 Hóa đơn & biên lai thanh toán */
  @Expose()
  @Transform(({ obj }) =>
    obj?.payment_proof_url
      ? obj.payment_proof_url.startsWith('http')
        ? obj.payment_proof_url
        : `${getImageUrl()}${obj.payment_proof_url}`
      : null,
  )
  payment_proof_url?: string;

  /** 🔗 Liên kết với các dịch vụ thanh toán */
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

  /** 🧾 Danh sách chi tiết sản phẩm trong đơn (find-by-id) */
  @Expose()
  details?: any[]; // hoặc: details?: OrderDetailsDTO[];

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
    value ? moment(value, moment.ISO_8601).format('DD/MM/YYYY HH:mm') : null,
  )
  created_at?: string;

  @Expose()
  @Transform(({ value }) =>
    value ? moment(value, moment.ISO_8601).format('DD/MM/YYYY HH:mm') : null,
  )
  updated_at?: string;
}
