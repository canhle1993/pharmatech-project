export class Account {
  id?: string; // 🔹 ID trả về từ NestJS (DTO)
  _id?: string; // 🔹 ID MongoDB cũ (phòng trường hợp dữ liệu chưa migrate)
  name!: string; // Họ và tên đầy đủ
  phone?: string; // Số điện thoại
  address?: string; // Địa chỉ
  gender?: string; // Giới tính
  photo?: string; // Ảnh đại diện (URL)
  username!: string; // Tên đăng nhập
  email!: string; // Email đăng nhập
  password!: string; // Mật khẩu (mã hóa ở backend)
  roles: string[] = []; // Danh sách vai trò: ['admin', 'user', 'candidate']
  is_active: boolean = true; // Trạng thái hoạt động
  is_delete: boolean = false; // Trạng thái xóa mềm
  last_login?: Date; // Lần đăng nhập gần nhất
  created_at?: Date; // Ngày tạo tài khoản
  updated_at?: Date; // Ngày cập nhật gần nhất
  loading?: boolean;
}
