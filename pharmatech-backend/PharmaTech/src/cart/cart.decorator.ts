import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'carts', timestamps: false })
export class Cart extends Document {
  /** 🧑 Người dùng (Account) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  user_id!: string;

  /** 📦 Sản phẩm (Product) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product_id!: string;

  /** 🔢 Số lượng */
  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity!: number;

  /** 💰 Giá tại thời điểm thêm vào giỏ */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  price!: number;

  /** 💵 Tổng tiền (price * quantity) */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  total_price!: number;

  /** 🕒 Ngày tạo */
  @Prop({ type: Date, default: Date.now })
  created_at?: Date;

  /** 🕓 Ngày cập nhật gần nhất */
  @Prop({ type: Date, default: Date.now })
  updated_at?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

/**
 * 🔁 Middleware tự động cập nhật total_price mỗi khi lưu
 * (chạy khi create hoặc update quantity/price)
 */
CartSchema.pre<Cart>('save', function (next) {
  this.total_price = (this.price || 0) * (this.quantity || 0);
  this.updated_at = new Date();
  next();
});
