export class Category {
  id?: string; // 🔹 ID trả về từ NestJS (DTO)
  _id?: string; // 🔹 ID MongoDB cũ (phòng trường hợp dữ liệu chưa migrate)
  name!: string; // Tên danh mục (Capsule, Tablet, Liquid Filling...)
  description?: string; // Mô tả chi tiết
  photo?: string; // Ảnh minh họa (URL)
  is_active: boolean = true; // Trạng thái hiển thị
  is_delete: boolean = false; // Xóa mềm
  updated_by?: string; // Tên người chỉnh sửa cuối (Account.name)
  created_at?: Date | string; // Ngày tạo
  updated_at?: Date | string; // Ngày cập nhật
  loading?: boolean; // Trạng thái loading khi thao tác
}
