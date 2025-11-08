import { Expose, Transform } from 'class-transformer';

export class WishlistDTO {
  /** 🆔 ID của wishlist */
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.() || obj.id)
  id?: string;

  /** 🧑 Người dùng */
  @Expose()
  @Transform(({ obj }) => obj.user_id?._id?.toString?.() || obj.user_id)
  user_id!: string;

  /** 📦 Sản phẩm */
  @Expose()
  @Transform(({ obj }) => obj.product_id?._id?.toString?.() || obj.product_id)
  product_id!: string;

  /** 🕒 Ngày tạo */
  @Expose()
  created_at?: Date | string;

  /** 👤 Thông tin user populate */
  @Expose()
  @Transform(({ obj }) => obj.user_id || obj.user)
  user?: any;

  /** 📦 Thông tin product populate */
  @Expose()
  @Transform(({ obj }) => obj.product_id || obj.product)
  product?: any;
}
