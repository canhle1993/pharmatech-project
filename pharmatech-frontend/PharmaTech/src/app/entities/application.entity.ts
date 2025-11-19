export class Application {
  id?: string;
  is_active?: boolean;
  account_id!: string;
  career_id!: string;
  account?: any;
  career?: any;

  // 🧾 Thông tin hồ sơ nộp

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

  // 🧑‍💼 Admin assignment
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  assigned_at?: Date;

  // 🗓️ Interview
  interview_date?: Date;
  interview_location?: string;
  interview_email_content?: string;

  // 🧾 Kết quả chung
  result?: 'pass' | 'fail' | 'pending' | null;
  hired_start_date?: Date;
  hired_department?: string;
  email_sent?: boolean;

  // 🟩 PASS info
  pass_date?: Date;
  start_work_date?: Date;
  pass_location?: string;
  pass_email_content?: string;

  // 🟥 REJECT info
  reject_date?: Date;
  reject_reason?: string;
  reject_email_content?: string;
  rejected_by?: string;

  // ⏱ timestamps
  created_at?: Date;
  updated_at?: Date;
}
