import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './wishlist.decorator';
import { WishlistDTO } from './wishlist.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly _wishlistModel: Model<Wishlist>,
  ) {}

  // =====================================================
  // ❤️ LẤY TẤT CẢ WISHLIST (CHO ADMIN)
  // =====================================================
  async findAll(): Promise<WishlistDTO[]> {
    const wishlists = await this._wishlistModel
      .find()
      .populate({
        path: 'user_id',
        model: 'Account',
        select: 'name email photo',
      })
      .populate({
        path: 'product_id',
        model: 'Product',
        select: 'name price photo stock_status',
      })
      .sort({ created_at: -1 })
      .lean();

    return wishlists.map((w) =>
      plainToInstance(WishlistDTO, w, { excludeExtraneousValues: true }),
    );
  }

  // =====================================================
  // 💖 LẤY WISHLIST THEO USER
  // =====================================================
  async findByUser(userId: string): Promise<WishlistDTO[]> {
    const wishlists = await this._wishlistModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate({
        path: 'product_id',
        select:
          'name model price photo specification introduce stock_quantity stock_status is_delete',
      })
      .populate({
        path: 'user_id',
        select: 'name email photo',
      })
      .sort({ created_at: -1 })
      .lean();

    // 🧹 LOẠI wishlist item nếu product bị xóa hoặc null
    const filtered = wishlists.filter((w) => {
      const p: any = w.product_id; // ép kiểu
      return p && p.is_delete !== true;
    });

    return filtered.map((w) =>
      plainToInstance(WishlistDTO, w, { excludeExtraneousValues: true }),
    );
  }

  // =====================================================
  // ➕ THÊM SẢN PHẨM VÀO WISHLIST
  // =====================================================
  async add(wishlistDTO: WishlistDTO): Promise<WishlistDTO> {
    try {
      if (!wishlistDTO.user_id || !wishlistDTO.product_id) {
        throw new HttpException(
          'Missing user_id or product_id',
          HttpStatus.BAD_REQUEST,
        );
      }

      const userObjId = new Types.ObjectId(String(wishlistDTO.user_id));
      const productObjId = new Types.ObjectId(String(wishlistDTO.product_id));

      // 🔍 Kiểm tra trùng
      const exists = await this._wishlistModel.findOne({
        user_id: userObjId,
        product_id: productObjId,
      });

      if (exists) {
        throw new HttpException(
          'Product already in wishlist',
          HttpStatus.CONFLICT,
        );
      }

      // ✅ Tạo mới
      const created = await this._wishlistModel.create({
        user_id: userObjId,
        product_id: productObjId,
        created_at: new Date(),
      });

      // ✅ Populate lại dữ liệu
      const populated = await this._wishlistModel
        .findById(created._id)
        .populate('user_id', 'name email photo')
        .populate('product_id', 'name price photo stock_status')
        .lean();

      return plainToInstance(WishlistDTO, populated, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      throw new HttpException(
        {
          message: err.response?.message || 'Failed to add to wishlist',
          error: err.message,
        },
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =====================================================
  // ❌ XOÁ MỘT SẢN PHẨM KHỎI WISHLIST
  // =====================================================
  async remove(id: string): Promise<{ msg: string }> {
    const result = await this._wishlistModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Wishlist item not found');
    return { msg: 'Removed from wishlist' };
  }

  // =====================================================
  // 🧹 XOÁ TOÀN BỘ WISHLIST CỦA USER
  // =====================================================
  async clearUserWishlist(userId: string): Promise<{ msg: string }> {
    await this._wishlistModel.deleteMany({
      user_id: new Types.ObjectId(userId),
    });
    return { msg: 'User wishlist cleared' };
  }
}
