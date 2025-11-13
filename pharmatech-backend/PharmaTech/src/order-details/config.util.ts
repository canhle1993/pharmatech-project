import * as dotenv from 'dotenv';

// ✅ Tự động load .env ở root dự án
dotenv.config();

/**
 * Hàm trả về URL gốc cho ảnh từ biến môi trường
 * Nếu không có, trả chuỗi rỗng để tránh lỗi undefined
 */
export function getImageUrl(): string {
  const base = process.env.image_url || '';
  return base.endsWith('/') ? base : base + '/';
}
