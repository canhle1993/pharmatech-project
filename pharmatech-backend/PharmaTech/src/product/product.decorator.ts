import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  collection: 'products',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Product {
  @Prop({ required: true, unique: true })
  name: string; // Tên sản phẩm

  @Prop({ type: String })
  model?: string; // Mã model (VD: TDP-5, DHF-2Head,...)

  @Prop()
  description?: string; // Mô tả chi tiết

  @Prop()
  specification?: string; // Thông số kỹ thuật

  @Prop()
  price?: number; // Giá

  @Prop()
  manufacturer?: string; // Nhà sản xuất

  @Prop()
  photo?: string; // Ảnh chính

  /** ✅ Liên kết nhiều category (tùy chọn, để populate nhanh) */
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Category', default: [] })
  category_ids?: string[];

  @Prop({ default: true })
  is_active: boolean; // Hiển thị hay không

  @Prop({ default: false })
  is_delete: boolean; // Xóa mềm

  @Prop()
  updated_by?: string; // Người cập nhật cuối

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
