<<<<<<< HEAD
// src/product/product.decorator.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/category/category.decorator';
=======
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
>>>>>>> origin/main

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
<<<<<<< HEAD
  model?: string; // Mã model, ví dụ: TDP-5, DHF-2Head,...

  @Prop()
  description?: string; // Mô tả chi tiết sản phẩm

  @Prop()
  photo?: string; // Ảnh chính

  @Prop({ type: [String], default: [] })
  gallery?: string[]; // Bộ sưu tập ảnh phụ

  @Prop({ type: MongooseSchema.Types.ObjectId })
  category_id: MongooseSchema.Types.ObjectId; // ✅ chỉ lưu ID
=======
  model?: string; // Mã model (VD: TDP-5, DHF-2Head,...)

  @Prop()
  description?: string; // Mô tả chi tiết
>>>>>>> origin/main

  @Prop()
  specification?: string; // Thông số kỹ thuật

  @Prop()
<<<<<<< HEAD
  price?: number; // Giá (nếu cần hiển thị)
=======
  price?: number; // Giá
>>>>>>> origin/main

  @Prop()
  manufacturer?: string; // Nhà sản xuất

<<<<<<< HEAD
  @Prop({ default: true })
  is_active: boolean; // Hiển thị sản phẩm hay không
=======
  @Prop()
  photo?: string; // Ảnh chính

  /** ✅ Liên kết nhiều category (tùy chọn, để populate nhanh) */
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Category', default: [] })
  category_ids?: string[];

  @Prop({ default: true })
  is_active: boolean; // Hiển thị hay không
>>>>>>> origin/main

  @Prop({ default: false })
  is_delete: boolean; // Xóa mềm

  @Prop()
<<<<<<< HEAD
  updated_by?: string; // Người chỉnh sửa cuối
=======
  updated_by?: string; // Người cập nhật cuối
>>>>>>> origin/main

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
