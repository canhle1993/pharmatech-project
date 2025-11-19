import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDTO } from './cart.dto';

@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** 🔹 Lấy tất cả giỏ hàng (dành cho admin) */
  @Get('find-all')
  async findAll() {
    return this.cartService.findAll();
  }

  /** 🔹 Lấy giỏ hàng theo user */
  @Get('find-by-user/:userId')
  async findByUser(@Param('userId') userId: string) {
    if (!userId)
      throw new HttpException('Missing userId', HttpStatus.BAD_REQUEST);
    return this.cartService.findByUser(userId);
  }

  /** 🔹 Thêm sản phẩm vào giỏ */
  @Post('add')
  async add(@Body() body: any) {
    try {
      return await this.cartService.add(body);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to add to cart', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Cập nhật số lượng */
  @Put('update-quantity/:id')
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (!quantity || quantity <= 0)
      throw new HttpException('Invalid quantity', HttpStatus.BAD_REQUEST);
    return this.cartService.updateQuantity(id, quantity);
  }

  /** 🔹 Xóa sản phẩm khỏi giỏ */
  @Delete('remove/:id')
  async remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }

  /** 🔹 Xóa toàn bộ giỏ hàng của user */
  @Delete('clear/:userId')
  async clearUserCart(@Param('userId') userId: string) {
    if (!userId)
      throw new HttpException('Missing userId', HttpStatus.BAD_REQUEST);
    return this.cartService.clearUserCart(userId);
  }

  @Get('find-one/:id')
  async findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }
}
