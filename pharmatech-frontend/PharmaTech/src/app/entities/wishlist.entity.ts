import { Product } from './product.entity';
import { Account } from './account.entity';

export class Wishlist {
  id?: string;
  _id?: string;
  user_id!: string | Account | any;
  product_id!: string | Product | any;
  product?: Product | any; // ✅ Thêm dòng này
  created_at?: Date | string;
  updated_at?: Date | string;
  loading?: boolean;

  /** ✅ Ảnh sản phẩm */
  get productPhoto(): string {
    const p: any = this.product || this.product_id;
    if (p && p.photo) {
      if (p.photo.startsWith('http')) return p.photo;
      return `http://localhost:3000/upload/${p.photo}`;
    }
    return 'assets/images/no-image.jpg';
  }

  /** ✅ Tên sản phẩm */
  get productName(): string {
    const p: any = this.product || this.product_id;
    return p && p.name ? p.name : '(Unnamed Product)';
  }

  /** ✅ Giá sản phẩm */
  /** ✅ Giá sản phẩm */
  get productPrice(): string {
    const p: any = this.product || this.product_id;
    if (p && typeof p === 'object' && p.price != null) {
      const val = Number(p.price);
      // ✅ Dùng định dạng USD thay vì ₫
      return val.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
    }
    return '$0.00';
  }

  /** ✅ Model sản phẩm */
  get productModel(): string {
    const p: any = this.product || this.product_id;
    return p && typeof p === 'object' && p.model ? p.model : '';
  }
  /** ✅ Nhãn trạng thái tồn kho */
  get stockStatusLabel(): string {
    const s = this.product?.stock_status || this.product_id?.stock_status;
    switch (s) {
      case 'in_stock':
        return 'In Stock';
      case 'preorder':
        return 'Pre-order';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  }

  /** ✅ Màu badge tương ứng trạng thái */
  get stockStatusColor(): string {
    const s = this.product?.stock_status || this.product_id?.stock_status;
    if (s === 'in_stock') return 'bg-success';
    if (s === 'preorder') return 'bg-warning';
    if (s === 'out_of_stock') return 'bg-danger';
    return 'bg-secondary';
  }
}
