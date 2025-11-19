import { Product } from './product.entity';
import { Account } from './account.entity';

export class Cart {
  id?: string;
  _id?: string;

  user_id!: string | Account | any;
  product_id!: string | Product | any;

  quantity!: number;
  price!: number;
  total_price!: number;

  created_at?: Date | string;
  updated_at?: Date | string;

  loading?: boolean;
  productStock?: number;

  /** ✅ Ảnh sản phẩm (xử lý cả khi product_id là Object hoặc String) */
  get productPhoto(): string {
    const p: any = this.product_id;
    if (p && p.photo) {
      // Nếu đã là URL tuyệt đối
      if (p.photo.startsWith('http')) return p.photo;

      // Nếu chỉ là tên file, ghép với env.imageUrl
      return `http://localhost:3000/upload/${p.photo}`;
    }

    // Nếu không có ảnh
    return 'assets/images/no-image.jpg';
  }

  get productName(): string {
    const p: any = this.product_id;
    return p && p.name ? p.name : '(Unnamed Product)';
  }

  /** ✅ Model sản phẩm */
  get productModel(): string {
    const p: any = this.product_id;
    return p && typeof p === 'object' && p.model ? p.model : '';
  }

  /** ✅ Tổng tiền định dạng */
  get formattedTotal(): string {
    return this.total_price
      ? this.total_price.toLocaleString('en-US') + ' USD'
      : '0 USD';
  }
}
