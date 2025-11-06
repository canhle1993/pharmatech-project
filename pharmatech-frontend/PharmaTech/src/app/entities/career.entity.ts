// src/app/models/career.entity.ts

export class Career {
  id?: string;

  // 🧱 Thông tin cơ bản
  title!: string;
  department!: string;
  location!: string;
  description!: string;
  requirements?: string;
  salary_range?: string;
  banner?: string;
  posted_by!: string;

  // 📋 Thông tin chi tiết tuyển dụng
  quantity?: number; // Số lượng tuyển
  level?: string; // Cấp bậc (Intern, Junior, Senior,...)
  experience?: string; // Kinh nghiệm yêu cầu
  min_experience?: string; // Kinh nghiệm tối thiểu
  education_level?: string; // Trình độ học vấn tối thiểu
  work_type?: string; // Hình thức làm việc (Full-time, Remote,...)
  working_hours?: string; // Giờ làm việc
  working_days?: string; // Ngày làm việc (Thứ 2 - Thứ 6)
  area?: string; // Khu vực (Miền Bắc, Miền Nam,...)
  industry?: string[]; // Ngành nghề
  field?: string[]; // Lĩnh vực
  age_range?: string; // Độ tuổi mong muốn
  gender?: string; // Giới tính
  nationality?: string; // Quốc tịch
  marital_status?: string; // Tình trạng hôn nhân
  language?: string[]; // Ngôn ngữ trình bày hồ sơ

  // 🧩 Kỹ năng và phúc lợi
  skills?: string[]; // Danh sách kỹ năng
  benefits?: string[]; // Danh sách phúc lợi

  // 📅 Ngày và trạng thái
  posted_date?: Date; // Ngày đăng tin
  expiration_date?: Date; // Ngày hết hạn
  is_active?: boolean; // Trạng thái hiển thị
  created_at?: string; // Ngày tạo
  updated_at?: string; // Ngày cập nhật
}
