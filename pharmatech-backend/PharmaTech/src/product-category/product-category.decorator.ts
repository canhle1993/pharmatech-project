import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'product_categories', timestamps: true })
export class ProductCategory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  product_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  category_id: string;

  @Prop()
  updated_by?: string;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);
ProductCategorySchema.index(
  { product_id: 1, category_id: 1 },
  { unique: true },
);
