<<<<<<< HEAD
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
=======
// src/category/category.decorator.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;
>>>>>>> origin/main

@Schema({
  collection: 'categorys',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
<<<<<<< HEAD
export class Category extends Document {
=======
export class Category {
>>>>>>> origin/main
  @Prop({ required: true, unique: true })
  name: string; // Tên danh mục (Capsule, Tablet, Liquid Filling...)

  @Prop()
  description?: string; // Mô tả chi tiết

  @Prop()
  photo?: string; // Ảnh minh họa

  @Prop({ default: true })
  is_active: boolean; // Trạng thái hiển thị

  @Prop({ default: false })
  is_delete: boolean; // Xóa mềm

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;

  @Prop()
  updated_by?: string; // 🧍 Tên người chỉnh sửa cuối (lấy từ Account.name)
}

export const CategorySchema = SchemaFactory.createForClass(Category);
