import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  collection: 'orders',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Order {
  /** 🧍 ID người dùng (liên kết bảng Account) */
  @Prop({ required: true })
  user_id: string;

  /** 🧾 Thông tin người đặt hàng */
  @Prop({ required: true })
  contact_name: string;

  @Prop({ required: true })
  contact_email: string;

  @Prop({ required: true })
  contact_phone: string;

  @Prop({ required: true })
  contact_address: string;

  /** 💰 Tổng giá trị đơn hàng (tính theo tất cả sản phẩm) */
  @Prop({ required: true })
  total_amount: number;

  /** 💵 Phần trăm đặt cọc (VD: 5, 30, 50) */
  @Prop({ required: true })
  deposit_percent: number;

  /** 💳 Số tiền người dùng đã đặt cọc qua PayPal */
  @Prop({ required: true })
  deposit_amount: number;

  /** 💰 Số tiền còn lại phải thanh toán (sau khi cọc) */
  @Prop({ default: 0 })
  remaining_payment_amount: number;

  /** 🏦 Phương thức thanh toán phần còn lại (Bank, Cash,...) */
  @Prop()
  remaining_payment_method?: string;

  /** 📅 Ngày user thanh toán phần còn lại */
  @Prop()
  remaining_payment_date?: Date;

  /** 📝 Ghi chú thêm khi admin xác nhận thanh toán còn lại */
  @Prop()
  remaining_payment_note?: string;

  /** 📎 Link ảnh biên lai chuyển khoản (nếu có) */
  @Prop()
  payment_proof_url?: string;

  /** 💳 Mã order Stripe (ID do Stripe cấp) */
  @Prop()
  paypal_order_id?: string;

  /** 🧾 Mã thanh toán (capture_id) do Stripe trả về */
  @Prop()
  payment_id?: string;

  /** 💸 Mã hoàn tiền (refund_id) nếu có hoàn lại */
  @Prop()
  refund_id?: string;

  /** 💳 Hình thức thanh toán chính (Stripe, Momo, Bank Transfer,...) */
  @Prop()
  payment_method?: string;

  /** 📦 Trạng thái tổng thể của đơn hàng */
  @Prop({
    default: 'Pending',
    enum: [
      'Pending',
      'Deposit Paid',
      'Paid in Full',
      'Cancelled',
      'Refunded',
      'Completed',
    ],
  })
  status: string;

  /** 🧾 Trạng thái phê duyệt của admin */
  @Prop({
    default: 'Pending Approval',
    enum: ['Pending Approval', 'Approved', 'Rejected'],
  })
  approval_status: string;

  /** 🔁 Trạng thái hoàn tiền (nếu có) */
  @Prop({
    default: 'None',
    enum: ['None', 'Deposit Lost', 'Deposit Refunded'],
  })
  refund_status: string;

  /** 🕓 Thời gian thanh toán full (cọc + còn lại) */
  @Prop()
  paid_at?: Date;

  /** 🕓 Thời gian huỷ đơn */
  @Prop()
  cancelled_at?: Date;

  /** 📄 Lý do huỷ đơn */
  @Prop()
  cancel_reason?: string;

  /** 🕓 Thời gian hoàn tiền (nếu có) */
  @Prop()
  refund_time?: Date;

  /** 📦 Gộp tóm tắt danh sách sản phẩm (tùy chọn) */
  @Prop({ type: Array, default: [] })
  items?: any[];

  /** ⚙️ Quản lý trạng thái hệ thống */
  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_delete: boolean;

  /** 🧑‍💻 Theo dõi chỉnh sửa */
  @Prop()
  updated_by?: string;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
