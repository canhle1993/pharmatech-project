import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'order_details' })
export class OrderDetails extends Document {
  /** 🔗 Thuộc về đơn hàng nào */
  @Prop({ required: true })
  order_id: string;

  /** 🔗 Tham chiếu sản phẩm (lưu dạng id chuỗi để tránh lệ thuộc schema) */
  @Prop({ required: true })
  product_id: string;

  /** 🧾 Snapshot thông tin sản phẩm tại thời điểm đặt */
  @Prop({ required: true })
  product_name: string;

  @Prop()
  product_model?: string;

  /** 📸 Ảnh chính (lưu TÊN FILE như product.photo; DTO sẽ build URL) */
  @Prop()
  product_photo?: string;

  /** 💰 Đơn giá tại thời điểm đặt */
  @Prop({ required: true })
  unit_price: number;

  /** 🔢 Số lượng */
  @Prop({ required: true })
  quantity: number;

  /** 💵 Thành tiền (unit_price * quantity) */
  @Prop({ required: true })
  total_price: number;

  // 📦 Trạng thái sản phẩm trong đơn (tuỳ hệ thống)
  @Prop({ default: 'Pending' })
  status: string;
  /*
    Pending     - Chờ xử lý
    Preparing   - Đang chuẩn bị
    Delivered   - Đã giao
    Returned    - Đã trả hàng
  */

  /** ⚙️ Trạng thái hệ thống */
  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_delete: boolean;

  /** 👨‍💻 Theo dõi chỉnh sửa */
  @Prop()
  updated_by?: string;

  /** 🕓 Thời gian tạo/cập nhật (tự quản lý) */
  @Prop({ default: () => new Date() })
  created_at?: Date;

  @Prop({ default: () => new Date() })
  updated_at?: Date;
}

export const OrderDetailsSchema = SchemaFactory.createForClass(OrderDetails);
