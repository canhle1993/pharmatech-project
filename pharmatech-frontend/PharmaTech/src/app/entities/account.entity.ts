export class Account {
  id?: string; // 🔹 ID trả về từ NestJS (DTO)
  _id?: string; // 🔹 ID MongoDB cũ (phòng trường hợp dữ liệu chưa migrate)
  name!: string; // Họ và tên đầy đủ
  phone?: string; // Số điện thoại
  address?: string; // Địa chỉ
  gender?: string; // Giới tính
  dob?: string | Date; // Ngày sinh
  photo?: string; // Ảnh đại diện (URL)
  username!: string; // Tên đăng nhập
  email!: string; // Email đăng nhập
  password?: string; // Mật khẩu (ẩn phía frontend)
  roles: string[] = []; // Vai trò: ['admin', 'doctor', 'patient', ...]
  is_active: boolean = true; // Trạng thái hoạt động
  is_delete: boolean = false; // Trạng thái xóa mềm
  last_login?: Date; // Lần đăng nhập gần nhất
  created_at?: Date; // Ngày tạo tài khoản
  updated_at?: Date; // Ngày cập nhật gần nhất
  loading?: boolean;

  // 🗺️ Vị trí & khu vực mong muốn
  preferred_area?: string; // Khu vực mong muốn làm việc (VD: Hanoi, HCMC...)
  nationality?: string; // Quốc tịch
  marital_status?: string; // Tình trạng hôn nhân
  age_range?: string; // Nhóm tuổi (VD: 25–30)

  // 🎯 Mong muốn việc làm
  job_type?: string; // Loại công việc (Full-time, Remote,...)
  expected_salary?: number; // Mức lương kỳ vọng
  available_from?: string | Date; // Ngày có thể bắt đầu làm việc

  // 🧠 Kỹ năng & Ngôn ngữ
  field?: string[]; // Lĩnh vực chuyên môn (R&D, QA, QC, Production...)
  industry?: string[]; // Ngành nghề (Pharma, Manufacturing...)
  skills?: string[]; // Danh sách kỹ năng
  languages?: string[]; // Ngôn ngữ sử dụng
  benefits?: string[]; // Phúc lợi mong muốn

  // 🧑‍🎓 Học vấn
  education?: {
    education_level?: string; // Trình độ học vấn
    major?: string; // Chuyên ngành
    school_name?: string; // Tên trường
    graduation_year?: number; // Năm tốt nghiệp
  };

  // 💼 Kinh nghiệm làm việc
  experience?: {
    company_name?: string; // Tên công ty
    job_title?: string; // Vị trí công việc
    working_years?: number; // Số năm kinh nghiệm
    responsibilities?: string; // Mô tả công việc chính
  };

  // 🧾 Hồ sơ & giới thiệu
  resume?: string; // URL file resume (PDF)
  introduction?: string; // Giới thiệu bản thân
}
