import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'wishlists', timestamps: false })
export class Wishlist extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Account',
    required: true,
  })
  user_id!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product_id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  created_at?: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
