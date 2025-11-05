import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({
  collection: 'product_images',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class ProductImage extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  product_id: string; // liên kết tới Product

  @Prop({ required: true })
  url: string; // đường dẫn ảnh

  @Prop()
  caption?: string; // mô tả ngắn

  @Prop({ default: false })
  is_main?: boolean; // nếu muốn đánh dấu ảnh chính (phụ)

  @Prop()
  updated_by?: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);
