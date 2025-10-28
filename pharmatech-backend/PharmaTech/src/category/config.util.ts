import * as dotenv from 'dotenv';

// 🔹 Tự load file .env từ gốc dự án
dotenv.config();

/**
 * Hàm trả về URL ảnh từ .env
 * Nếu không có, sẽ trả chuỗi rỗng tránh lỗi undefined
 */
export function getImageUrl(): string {
  const base = process.env.image_url || '';
  return base.endsWith('/') ? base : base + '/';
}
