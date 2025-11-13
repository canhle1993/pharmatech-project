// src/app/entities/application.entity.ts
export class Application {
  id?: string;
  account_id!: string;
  career_id!: string;
  account?: any;
  career?: any;

  // 🧾 Thông tin hồ sơ nộp
  resume?: string;
  cover_letter?: string;
  portfolio?: string;
  expected_salary?: number;
  available_from?: Date;

  // 🧠 Trạng thái xử lý
  status?:
    | 'pending'
    | 'reviewed'
    | 'assigned'
    | 'interview'
    | 'accepted'
    | 'rejected';
  reviewed_date?: Date;
  note?: string;

  // 🧑‍💼 Phân công admin (SuperAdmin dùng)
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  assigned_at?: Date;

  // 🗓️ Thông tin phỏng vấn (Admin dùng)
  interview_date?: Date;
  interview_location?: string;
  interview_email_content?: string;

  // 🧾 Kết quả tuyển dụng
  result?: 'pass' | 'fail' | null;
  hired_start_date?: Date;
  hired_department?: string;
  email_sent?: boolean;

  // 🕒 Thời gian tạo / cập nhật
  created_at?: Date;
  updated_at?: Date;
}
