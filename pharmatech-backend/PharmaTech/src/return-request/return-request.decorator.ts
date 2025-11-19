import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReturnRequestDocument = HydratedDocument<ReturnRequest>;

/**
 * 🧾 Phiếu yêu cầu đổi hàng (Return Request)
 */
@Schema({
  collection: 'return_requests',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ReturnRequest {
  /** 🔗 Đơn hàng gốc (Order) */
  @Prop({ required: true })
  order_id: string;

  /** 👤 User của đơn hàng (lưu snapshot để tiện filter sau này) */
  @Prop({ required: true })
  user_id: string;

  /** 📦 Danh sách item trong đơn hàng bị lỗi (snapshot) */
  @Prop({ type: Array, default: [] })
  items: {
    order_detail_id: string;
    product_id: string;
    product_name: string;
    product_model?: string;
    product_photo?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];

  /** 🧺 Sản phẩm mới dùng để đổi cho khách (product trong kho) */
  @Prop({ required: true })
  replacement_product_id: string;

  /** 🧾 Snapshot sản phẩm mới */
  @Prop()
  replacement_product_name?: string;

  @Prop()
  replacement_product_model?: string;

  @Prop()
  replacement_product_photo?: string;

  @Prop()
  replacement_unit_price?: number;

  /** 🔢 Tổng số lượng được đổi (tổng quantity của các item lỗi) */
  @Prop({ required: true })
  total_quantity: number;

  /** 📝 Lý do đổi hàng */
  @Prop()
  reason?: string;

  /** 📎 Ảnh minh chứng hư hại */
  @Prop({ type: [String], default: [] })
  damage_photos?: string[];

  /** 📦 Trạng thái xử lý đổi hàng */
  @Prop({
    default: 'Pending Manufacturer',
    enum: ['Pending Manufacturer', 'Completed', 'Cancelled'],
  })
  status: string;
  /*
    Pending Manufacturer - Đã đổi cho khách, chờ NSX gửi hàng mới về kho
    Completed            - Đã nhận hàng mới từ NSX, đã cộng stock lại
    Cancelled            - Yêu cầu đổi hàng bị hủy
  */

  /** ⚙️ Trạng thái hệ thống */
  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_delete: boolean;

  /** 👨‍💻 Theo dõi chỉnh sửa */
  @Prop()
  updated_by?: string;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
