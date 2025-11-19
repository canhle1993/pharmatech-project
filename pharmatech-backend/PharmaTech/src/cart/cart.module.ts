import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './cart.decorator';
import { Product, ProductSchema } from '../product/product.decorator'; // ✅
import { ProductModule } from '../product/product.module'; // ✅ import thêm
import { DepositSettingModule } from 'src/deposit-setting/deposit-setting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    DepositSettingModule,
    forwardRef(() => ProductModule), // ✅ lấy model Product từ ProductModule
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // ✅ export nếu module khác cần dùng
})
export class CartModule {}
