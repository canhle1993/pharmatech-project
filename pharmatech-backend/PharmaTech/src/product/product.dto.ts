import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class ProductDTO {
<<<<<<< HEAD
  // ✅ ID
=======
>>>>>>> origin/main
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

<<<<<<< HEAD
  // ✅ Tên sản phẩm
  @Expose()
  name: string;

  // ✅ Mã model (ví dụ: TDP-5, DHF-2Head,...)
  @Expose()
  model?: string;

  // ✅ Mô tả chi tiết
  @Expose()
  description?: string;

  // ✅ Ảnh chính (tự ghép URL)
=======
  @Expose()
  name: string;

  @Expose()
  model?: string;

  @Expose()
  description?: string;

  @Expose()
  specification?: string;

  @Transform(({ obj }) => (obj?.price ? Number(obj.price) : 0))
  @Expose()
  price?: number;

  @Expose()
  manufacturer?: string;

>>>>>>> origin/main
  @Transform(({ obj }) => (obj?.photo ? `${getImageUrl()}${obj.photo}` : null))
  @Expose()
  photo?: string | null;

<<<<<<< HEAD
  // ✅ Bộ sưu tập ảnh phụ
  @Transform(({ obj }) =>
    obj?.gallery && obj.gallery.length > 0
      ? obj.gallery.map((img: string) => `${getImageUrl()}${img}`)
      : [],
  )
  @Expose()
  gallery?: string[];

  @Transform(({ obj }) => obj.category_id?.toString()) // ✅ convert ObjectId to string
  @Expose({ name: 'categoryId' })
  categoryId: string;

  // ✅ Thông số kỹ thuật
  @Expose()
  specification?: string;

  // ✅ Giá (nếu có)
  @Expose()
  price?: number;

  // ✅ Nhà sản xuất
  @Expose()
  manufacturer?: string;

  // ✅ Trạng thái
=======
  /** ✅ Danh sách category mà sản phẩm thuộc về */
  @Expose({ name: 'category_ids' })
  category_ids?: string[];

  /** ✅ Nếu service populate categories ra luôn (dạng object) */
  @Expose()
  categories?: any[];

>>>>>>> origin/main
  @Expose({ name: 'is_active' })
  is_active: boolean;

  @Expose({ name: 'is_delete' })
  is_delete: boolean;

<<<<<<< HEAD
  // ✅ Người sửa cuối cùng
  @Expose({ name: 'updated_by' })
  updated_by?: string;

  // ✅ Ngày tạo & cập nhật
=======
  @Expose({ name: 'updated_by' })
  updated_by?: string;

>>>>>>> origin/main
  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string | null;

  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string | null;

  constructor(partial: Partial<ProductDTO>) {
    Object.assign(this, partial);
  }
}
