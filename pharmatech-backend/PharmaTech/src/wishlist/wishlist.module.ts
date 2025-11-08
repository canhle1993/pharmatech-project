import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wishlist, WishlistSchema } from './wishlist.decorator';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Product, ProductSchema } from '../product/product.decorator';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => ProductModule),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
