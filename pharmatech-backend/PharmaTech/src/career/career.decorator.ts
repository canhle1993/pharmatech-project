import * as mongoose from 'mongoose';

export const CareerSchema = new mongoose.Schema(
  {
    // 🧱 Thông tin cơ bản
    title: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    salary_range: { type: String },
    banner: { type: String },
    posted_by: { type: String, required: true },

    quantity: { type: Number }, // Số lượng tuyển
    level: { type: String }, // Cấp bậc (Intern, Junior, Senior,...)
    experience: { type: String }, // Kinh nghiệm yêu cầu
    work_type: { type: String }, // Hình thức làm việc (Full-time, Remote,...)
    area: { type: String }, // Khu vực tuyển (Miền Bắc, Miền Nam,...)
    posted_date: { type: Date }, // Ngày đăng tin
    expiration_date: { type: Date }, // Ngày hết hạn

    // ⚙️ Trạng thái hệ thống
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
  },
  {
    collection: 'careers', // tên collection trong MongoDB
  },
);
