import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './cart.decorator';
import { Product } from '../product/product.decorator'; // ✅ thêm
import { CartDTO } from './cart.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly _cartModel: Model<Cart>,

    @InjectModel(Product.name) // ✅ inject model Product đúng chuẩn
    private readonly _productModel: Model<Product>,
  ) {}

  // =====================================================
  // 📦 LẤY TOÀN BỘ GIỎ HÀNG (CHO ADMIN)
  // =====================================================
  async findAll(): Promise<CartDTO[]> {
    const carts = await this._cartModel
      .find()
      .populate({ path: 'user_id', select: 'name email photo' })
      .populate({
        path: 'product_id',
        model: this._productModel, // ✅ dùng model được inject
        select: 'name price photo',
      })
      .sort({ created_at: -1 })
      .lean();

    return carts.map((c) => plainToInstance(CartDTO, c));
  }

  // =====================================================
  // 🧾 LẤY GIỎ HÀNG THEO USER
  // =====================================================
  // =====================================================
  // 🧾 LẤY GIỎ HÀNG THEO USER
  // =====================================================
  async findByUser(userId: string): Promise<CartDTO[]> {
    // 🛡️ Guard: nếu userId không phải ObjectId hợp lệ → trả mảng rỗng
    if (!userId || !Types.ObjectId.isValid(userId)) {
      console.warn('[CartService.findByUser] Invalid userId:', userId);
      return [];
    }

    const carts = await this._cartModel
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
    const filtered = carts.filter((c) => {
      const p: any = c.product_id; // ép kiểu
      return p && p.is_delete !== true;
    });

    return filtered.map((c) => plainToInstance(CartDTO, c));
  }

  // async findByUser(userId: string): Promise<CartDTO[]> {
  //   const carts = await this._cartModel
  //     .find({ user_id: new Types.ObjectId(userId) })
  //     .populate({
  //       path: 'product_id',
  //       select: 'name model price photo specification introduce',
  //     })

  //     .populate({
  //       path: 'user_id',
  //       select: 'name email photo',
  //     })
  //     .sort({ created_at: -1 })
  //     .lean();

  //   return carts.map((c) => plainToInstance(CartDTO, c));
  // }

  // =====================================================
  // 🛒 THÊM SẢN PHẨM VÀO GIỎ
  // =====================================================
  // =====================================================
  // 🛒 THÊM SẢN PHẨM VÀO GIỎ (CÓ KIỂM TRA TỒN KHO)
  // =====================================================
  async add(cartDTO: CartDTO): Promise<CartDTO> {
    try {
      if (!cartDTO.user_id || !cartDTO.product_id) {
        throw new HttpException(
          'Missing user_id or product_id',
          HttpStatus.BAD_REQUEST,
        );
      }

      const userObjId = new Types.ObjectId(cartDTO.user_id);
      const productObjId = new Types.ObjectId(cartDTO.product_id);

      // ✅ Lấy sản phẩm để kiểm tra tồn kho
      const product = await this._productModel.findById(productObjId);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // ✅ Nếu hết hàng
      if (!product.stock_quantity || product.stock_quantity <= 0) {
        throw new HttpException(
          `${product.name} is out of stock.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 🔍 Kiểm tra sản phẩm đã có trong giỏ chưa
      const existing = await this._cartModel.findOne({
        user_id: userObjId,
        product_id: productObjId,
      });

      if (existing) {
        const newQty = existing.quantity + (cartDTO.quantity || 1);

        // ⚠️ Kiểm tra vượt tồn kho
        if (newQty > product.stock_quantity) {
          throw new HttpException(
            `Only ${product.stock_quantity} items available in stock.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        existing.quantity = newQty;
        existing.total_price = existing.price * existing.quantity;
        existing.updated_at = new Date();
        await existing.save();

        return plainToInstance(CartDTO, existing.toObject());
      }

      // ✅ Nếu là sản phẩm mới trong giỏ
      if ((cartDTO.quantity || 1) > product.stock_quantity) {
        throw new HttpException(
          `Only ${product.stock_quantity} items available in stock.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const total_price = (cartDTO.price || 0) * (cartDTO.quantity || 1);
      const created = await this._cartModel.create({
        user_id: userObjId,
        product_id: productObjId,
        quantity: cartDTO.quantity || 1,
        price: cartDTO.price || 0,
        total_price,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return plainToInstance(CartDTO, created.toObject());
    } catch (err) {
      throw new HttpException(
        {
          message: err.response?.message || 'Failed to add to cart',
          error: err.message,
        },
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =====================================================
  // 🔁 CẬP NHẬT SỐ LƯỢNG
  // =====================================================
  async updateQuantity(id: string, quantity: number): Promise<CartDTO> {
    const cart = await this._cartModel.findById(id);
    if (!cart) throw new NotFoundException('Cart item not found');

    cart.quantity = Math.max(1, quantity);
    cart.total_price = cart.price * cart.quantity;
    cart.updated_at = new Date();
    await cart.save();

    return plainToInstance(CartDTO, cart.toObject());
  }

  // =====================================================
  // ❌ XÓA MỘT SẢN PHẨM KHỎI GIỎ
  // =====================================================
  async remove(id: string): Promise<any> {
    const result = await this._cartModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Cart item not found');
    return { msg: 'Removed from cart' };
  }

  // =====================================================
  // 🧹 XÓA TOÀN BỘ GIỎ HÀNG CỦA USER
  // =====================================================
  // async clearUserCart(userId: string) {
  //   await this._cartModel.deleteMany({ user_id: new Types.ObjectId(userId) });
  //   return { msg: 'User cart cleared' };
  // }
  // =====================================================
  // 🧹 XÓA TOÀN BỘ GIỎ HÀNG CỦA USER
  // =====================================================
  async clearUserCart(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      console.warn('[CartService.clearUserCart] Invalid userId:', userId);
      return { msg: 'User cart cleared (invalid userId, nothing to delete)' };
    }

    await this._cartModel.deleteMany({ user_id: new Types.ObjectId(userId) });
    return { msg: 'User cart cleared' };
  }

  async findOne(id: string): Promise<Cart> {
    return this._cartModel.findById(id).populate('product_id').exec();
  }
}
