// src/product/product.decorator.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/category/category.decorator';

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
  model?: string; // Mã model, ví dụ: TDP-5, DHF-2Head,...

  @Prop()
  description?: string; // Mô tả chi tiết sản phẩm

  @Prop()
  photo?: string; // Ảnh chính

  @Prop({ type: [String], default: [] })
  gallery?: string[]; // Bộ sưu tập ảnh phụ

  @Prop({ type: MongooseSchema.Types.ObjectId })
  category_id: MongooseSchema.Types.ObjectId; // ✅ chỉ lưu ID

  @Prop()
  specification?: string; // Thông số kỹ thuật

  @Prop()
  price?: number; // Giá (nếu cần hiển thị)

  @Prop()
  manufacturer?: string; // Nhà sản xuất

  @Prop({ default: true })
  is_active: boolean; // Hiển thị sản phẩm hay không

  @Prop({ default: false })
  is_delete: boolean; // Xóa mềm

  @Prop()
  updated_by?: string; // Người chỉnh sửa cuối

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
