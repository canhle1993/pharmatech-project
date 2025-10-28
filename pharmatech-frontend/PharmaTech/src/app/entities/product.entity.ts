export class Product {
  id?: string; // 🔹 ID trả về từ NestJS (DTO)
  _id?: string; // 🔹 ID MongoDB cũ (nếu chưa migrate)
  name!: string; // Tên sản phẩm
  model?: string; // Mã model (VD: TDP-5, DHF-2Head...)
  description?: string; // Mô tả chi tiết
  photo?: string; // Ảnh chính (URL)
  gallery?: string[]; // Bộ sưu tập ảnh phụ
  categoryId: string; // Liên kết Category (populate sẽ có name)
  specification?: string; // Thông số kỹ thuật
  price?: number; // Giá bán
  manufacturer?: string; // Nhà sản xuất
  is_active: boolean = true; // Hiển thị / ẩn
  is_delete: boolean = false; // Xóa mềm
  updated_by?: string; // Người chỉnh sửa cuối
  created_at?: Date | string; // Ngày tạo
  updated_at?: Date | string; // Ngày cập nhật
  loading?: boolean; // Trạng thái loading khi thao tác
}
