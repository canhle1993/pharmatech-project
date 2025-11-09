import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OrderDetails extends Document {
  // 🔗 ID đơn hàng (liên kết với bảng Order)
  @Prop({ required: true })
  order_id: string;

  // 🔗 ID sản phẩm (liên kết với bảng Product)
  @Prop({ required: true })
  product_id: string;

  // 🧮 Số lượng sản phẩm trong đơn
  @Prop({ required: true })
  quantity: number;

  // 💰 Đơn giá tại thời điểm đặt hàng
  @Prop({ required: true })
  price: number;

  // 🧾 Tổng tiền của dòng sản phẩm (price * quantity)
  @Prop()
  subtotal?: number;

  // 📦 Trạng thái sản phẩm trong đơn (tuỳ hệ thống)
  @Prop({ default: 'Pending' })
  status: string;
  /*
    Pending     - Chờ xử lý
    Preparing   - Đang chuẩn bị
    Delivered   - Đã giao
    Returned    - Đã trả hàng
  */
}

export const OrderDetailsSchema = SchemaFactory.createForClass(OrderDetails);
