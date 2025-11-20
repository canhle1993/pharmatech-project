export class DepositSetting {
  /** 🆔 ID */
  id?: string; // ID từ DTO (Nest)
  _id?: string; // ID MongoDB gốc

  /** 💰 Khoảng tiền áp dụng (chỉ dùng khi type = 'range') */
  min_total?: number;
  max_total?: number;

  /** 📊 Tỷ lệ đặt cọc (chỉ khi type = 'range') */
  percent?: number;

  /** ⭐ Tỷ lệ cọc mặc định (chỉ dùng khi type = 'default') */
  default_percent?: number;

  /** ⚡ Trạng thái cấu hình */
  is_active: boolean = true;
  is_delete: boolean = false;

  /** 🧑‍💻 Theo dõi chỉnh sửa */
  updated_by?: string;
  created_at?: Date | string;
  updated_at?: Date | string;

  /** ⭐ Phân biệt loại cấu hình */
  type?: 'range' | 'default';

  /** 🔄 UI state */
  loading?: boolean;
}
