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

<<<<<<< HEAD
    // 📋 Chi tiết tuyển dụng
    quantity: { type: Number }, // Số lượng tuyển dụng
    level: { type: String }, // Cấp bậc
    experience: { type: String }, // Kinh nghiệm yêu cầu (tổng quát)
    min_experience: { type: String }, // Số năm kinh nghiệm tối thiểu
    education_level: { type: String }, // Trình độ học vấn tối thiểu
    work_type: { type: String }, // Full-time, Remote...
    working_hours: { type: String }, // Giờ làm việc
    working_days: { type: String }, // Ngày làm việc (T2–T6)
    area: { type: String }, // Miền Bắc, Miền Nam...
    industry: [{ type: String }], // Ngành nghề
    field: [{ type: String }], // Lĩnh vực (CNTT, Kinh doanh...)
    age_range: { type: String }, // Độ tuổi mong muốn
    gender: { type: String }, // Giới tính
    nationality: { type: String }, // Quốc tịch
    marital_status: { type: String }, // Tình trạng hôn nhân
    language: [{ type: String }], // Ngôn ngữ trình bày hồ sơ
    skills: [{ type: String }], // Kỹ năng yêu cầu

    // 💎 Phúc lợi
    benefits: [{ type: String }], // Các phúc lợi (thưởng, BHXH...)

    // 📅 Ngày đăng / hết hạn
    posted_date: { type: Date },
    expiration_date: { type: Date },
=======
    quantity: { type: Number }, // Số lượng tuyển
    level: { type: String }, // Cấp bậc (Intern, Junior, Senior,...)
    experience: { type: String }, // Kinh nghiệm yêu cầu
    work_type: { type: String }, // Hình thức làm việc (Full-time, Remote,...)
    area: { type: String }, // Khu vực tuyển (Miền Bắc, Miền Nam,...)
    posted_date: { type: Date }, // Ngày đăng tin
    expiration_date: { type: Date }, // Ngày hết hạn
>>>>>>> origin/main

    // ⚙️ Trạng thái hệ thống
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
  },
<<<<<<< HEAD
  { collection: 'careers' },
=======
  {
    collection: 'careers', // tên collection trong MongoDB
  },
>>>>>>> origin/main
);
