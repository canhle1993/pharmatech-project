import * as dotenv from 'dotenv';

// ✅ Tự động load .env ở root
dotenv.config();

/**
 * 🔹 Trả về URL gốc để hiển thị ảnh upload (ví dụ: ảnh biên lai thanh toán)
 * - Lấy từ biến môi trường `IMAGE_URL`
 * - Nếu không có, trả về chuỗi rỗng
 * - Đảm bảo có dấu '/' ở cuối URL
 */
export function getImageUrl(): string {
  const base = process.env.IMAGE_URL || process.env.image_url || '';
  if (!base) return '';
  return base.endsWith('/') ? base : base + '/';
}

/**
 * 🔹 Hàm tạo đường dẫn ảnh hoàn chỉnh (nếu tên file có sẵn)
 * @param fileName Tên file ảnh (VD: 'proof_123.png')
 * @returns URL đầy đủ (VD: 'http://localhost:3000/upload/proof_123.png')
 */
export function buildImageUrl(fileName?: string): string {
  if (!fileName) return '';
  return getImageUrl() + fileName;
}
