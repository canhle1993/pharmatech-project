export class ImportProductDTO {
  name: string;
  model?: string;
  price?: number;
  introduce?: string;
  description?: string;
  specification?: string;

  /** Số lượng tồn kho trong file Excel */
  stock_quantity?: number;
  stock_status?: string; // ✅ THÊM DÒNG NÀY

  /** Danh sách category IDs dạng ["id1","id2"] */
  category_ids?: string[];

  /** Người cập nhật */
  updated_by?: string;

  /** Ảnh không import từ Excel */
  photo?: string | null;
}
