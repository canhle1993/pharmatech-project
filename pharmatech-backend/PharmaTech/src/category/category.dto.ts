import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class CategoryDTO {
  // _id (ObjectId) -> id (string)
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  // Ghép URL ảnh đầy đủ, nếu không có thì trả null
  @Transform(({ obj }) => (obj?.photo ? `${getImageUrl()}${obj.photo}` : null))
  @Expose()
  photo?: string | null;

  @Expose({ name: 'is_active' })
  is_active: boolean;

<<<<<<< HEAD
=======
  @Expose()
  products?: any[]; // ✅ thêm để chứa danh sách sản phẩm thuộc category

>>>>>>> origin/main
  @Expose({ name: 'is_delete' })
  is_delete: boolean;

  @Expose({ name: 'updated_by' })
  updated_by?: string; // tên người chỉnh sửa cuối, lấy từ Account.name

  // Định dạng ngày tạo
  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string | null;

  // Định dạng ngày cập nhật
  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string | null;

  constructor(partial: Partial<CategoryDTO>) {
    Object.assign(this, partial);
  }
}
