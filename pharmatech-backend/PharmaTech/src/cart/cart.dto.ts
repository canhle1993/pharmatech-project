import { Expose, Transform } from 'class-transformer';

/**
 * 🛒 Cart Data Transfer Object (DTO)
 * Chuẩn hóa dữ liệu trả về từ MongoDB (sau populate)
 */
export class CartDTO {
  /** 🆔 ID của bản ghi trong giỏ hàng */
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.() || obj.id)
  id?: string;

  /** 🧑 Người dùng (Account) — giữ nguyên object nếu populate, hoặc ID nếu chưa */
  @Expose()
  @Transform(({ obj }) =>
    obj.user_id?._id ? obj.user_id : obj.user_id?.toString?.(),
  )
  user_id!: any;

  /** 📦 Sản phẩm (Product) — giữ nguyên object nếu populate, hoặc ID nếu chưa */
  @Expose()
  @Transform(({ obj }) =>
    obj.product_id?._id ? obj.product_id : obj.product_id?.toString?.(),
  )
  product_id!: any;

  /** 🔢 Số lượng sản phẩm */
  @Expose()
  quantity!: number;

  /** 💰 Giá tại thời điểm thêm vào giỏ */
  @Expose()
  price!: number;

  /** 💵 Tổng tiền (price * quantity) */
  @Expose()
  total_price!: number;

  /** 🕒 Thời điểm tạo bản ghi */
  @Expose()
  created_at?: Date | string;

  /** 🕓 Thời điểm cập nhật gần nhất */
  @Expose()
  updated_at?: Date | string;
}
