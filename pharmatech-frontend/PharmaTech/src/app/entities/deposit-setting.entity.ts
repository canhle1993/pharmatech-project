export class DepositSetting {
  /** ID */
  id?: string; // ID trả về từ NestJS (DTO)
  _id?: string; // ID MongoDB gốc (nếu có)

  /** 💰 Khoảng tiền áp dụng */
  min_total!: number; // Tổng tiền tối thiểu
  max_total!: number; // Tổng tiền tối đa

  /** 📊 Tỷ lệ đặt cọc */
  percent!: number; // Phần trăm đặt cọc (VD: 30%)

  /** ⚡ Trạng thái cấu hình */
  is_active: boolean = true; // Có đang áp dụng không
  is_delete: boolean = false; // Xóa mềm (không hiển thị)

  /** 🧑‍💻 Theo dõi chỉnh sửa */
  updated_by?: string; // Người cập nhật gần nhất
  created_at?: Date | string;
  updated_at?: Date | string;

  /** 🔄 UI state */
  loading?: boolean; // Dùng để disable nút khi đang xử lý
}
