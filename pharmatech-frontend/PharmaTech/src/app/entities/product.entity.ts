export class Product {
  /** 🆔 ID */
  id?: string; // ID trả về từ NestJS (DTO)
  _id?: string; // ID MongoDB gốc (nếu có)

  /** 📦 Thông tin cơ bản */
  name!: string; // Tên sản phẩm (bắt buộc)
  model?: string; // Mã model (VD: TDP-5, DHF-2Head,...)
  description?: string; // Mô tả chi tiết sản phẩm

  /** 🖼️ Hình ảnh */
  photo?: string; // Ảnh chính (URL đầy đủ)
  gallery?: string[]; // Bộ sưu tập ảnh phụ (URL đầy đủ)
  mainImageUrl?: string; // ảnh chính dạng URL nếu bạn dùng riêng upload-main

  /** ⚙️ Thông tin kỹ thuật & giá */
  specification?: string; // Thông số kỹ thuật
  price?: number; // Giá sản phẩm
  introduce?: string; // Nhà sản xuất

  /** 🔗 Liên kết category */
  category_ids?: string[]; // Danh sách ID category liên kết
  categories?: any[]; // Dữ liệu category populate ra (tên, mô tả,...)

  /** ⚡ Trạng thái */
  is_active: boolean = true;
  is_delete: boolean = false;

  /** 🧑‍💻 Theo dõi chỉnh sửa */
  updated_by?: string;
  created_at?: Date | string;
  updated_at?: Date | string;

  /** 🔄 UI state */
  loading?: boolean;
}
