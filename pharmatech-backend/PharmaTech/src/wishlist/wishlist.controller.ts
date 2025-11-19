import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistDTO } from './wishlist.dto';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /** 🔹 Lấy tất cả wishlist (dành cho admin) */
  @Get('find-all')
  async findAll() {
    return this.wishlistService.findAll();
  }

  /** 🔹 Lấy wishlist theo user */
  @Get('find-by-user/:userId')
  async findByUser(@Param('userId') userId: string) {
    if (!userId)
      throw new HttpException('Missing userId', HttpStatus.BAD_REQUEST);
    return this.wishlistService.findByUser(userId);
  }

  /** 🔹 Thêm sản phẩm vào wishlist */
  @Post('add')
  async add(@Body() body: any) {
    return await this.wishlistService.add(body);
  }

  /** 🔹 Xóa sản phẩm khỏi wishlist */
  @Delete('remove/:id')
  async remove(@Param('id') id: string) {
    if (!id) throw new HttpException('Missing id', HttpStatus.BAD_REQUEST);
    return this.wishlistService.remove(id);
  }

  /** 🔹 Xóa toàn bộ wishlist của user */
  @Delete('clear/:userId')
  async clearUserWishlist(@Param('userId') userId: string) {
    if (!userId)
      throw new HttpException('Missing userId', HttpStatus.BAD_REQUEST);
    return this.wishlistService.clearUserWishlist(userId);
  }
}
