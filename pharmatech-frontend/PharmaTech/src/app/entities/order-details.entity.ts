export class OrderDetails {
  /** 🆔 ID chi tiết */
  id?: string;
  _id?: string;

  /** 🔗 Liên kết đơn hàng và sản phẩm */
  order_id!: string;
  product_id!: string;

  /** 🧾 Snapshot thông tin sản phẩm tại thời điểm đặt */
  product_name!: string;
  product_model?: string;
  product_photo?: string;

  /** 💰 Giá & SL */
  unit_price!: number;
  quantity!: number;
  total_price!: number;

  /** 📦 Trạng thái sản phẩm trong đơn */
  status!: string;

  /** ⚙️ Trạng thái hệ thống */
  is_active?: boolean;
  is_delete?: boolean;
  updated_by?: string;

  /** 🕓 Thời gian */
  created_at?: string | Date;
  updated_at?: string | Date;

  /** 💡 Getter tiện ích cho UI */
  get photoUrl(): string {
    if (!this.product_photo) return 'assets/images/no-image.jpg';
    if (this.product_photo.startsWith('http')) return this.product_photo;
    return `http://localhost:3000/upload/${this.product_photo}`;
  }

  get formattedTotal(): string {
    return this.total_price
      ? this.total_price.toLocaleString('en-US') + ' USD'
      : '0 USD';
  }
}
