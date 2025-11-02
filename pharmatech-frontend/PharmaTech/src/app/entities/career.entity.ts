export class Career {
  id?: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  banner?: string;
  posted_by: string;

  quantity?: number; // Số lượng tuyển
  level?: string; // Cấp bậc (Intern, Junior, Senior,...)
  experience?: string; // Kinh nghiệm yêu cầu
  work_type?: string; // Hình thức làm việc (Full-time, Part-time,...)
  area?: string; // Khu vực tuyển (Miền Bắc, Miền Nam,...)
  posted_date?: Date; // Ngày đăng tin
  expiration_date?: Date;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
