export class ApplicationAnalytics {
  id?: string;

  // Khoá liên kết
  application_id!: string;
  account_id!: string;
  career_id!: string;

  // Thông tin ứng viên
  age?: number;
  age_range?: string;
  gender?: string;
  skills?: string[];
  languages?: string[];

  // Thông tin job
  career_title?: string;
  career_department?: string;

  // Trạng thái & tiến trình
  status?: string; // pending / reviewed / assigned / interview / passed / rejected…
  result?: string; // pass / fail / pending

  // Ngày tháng
  applied_date?: Date;
  reviewed_date?: Date;
  interview_date?: Date;
  hired_start_date?: Date;

  // Lương kỳ vọng
  expected_salary?: number;

  // Cập nhật cuối
  updated_at?: Date;
}
