import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';
import { DepositSetting } from '../entities/deposit-setting.entity';

@Injectable({
  providedIn: 'root',
})
export class DepositSettingService {
  private apiUrl = env.baseUrl + 'deposit-setting/';

  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // 🔹 LẤY DỮ LIỆU RANGE-SETTINGS
  // ==================================================

  /** 🔹 Lấy tất cả cấu hình đặt cọc (CHỈ RANGE, không default) */
  findAll(): Promise<DepositSetting[]> {
    return lastValueFrom(
      this.httpClient.get<DepositSetting[]>(this.apiUrl + 'find-all')
    );
  }

  /** 🔹 Lấy cấu hình theo ID */
  findById(id: string): Promise<DepositSetting> {
    return lastValueFrom(
      this.httpClient.get<DepositSetting>(this.apiUrl + 'find-by-id/' + id)
    );
  }

  /** 🔹 Lấy danh sách cấu hình đang active (CHỈ RANGE) */
  findActive(): Promise<DepositSetting[]> {
    return lastValueFrom(
      this.httpClient.get<DepositSetting[]>(this.apiUrl + 'find-active')
    );
  }

  // ==================================================
  // 🧾 TẠO / CẬP NHẬT RANGE-SETTINGS
  // ==================================================

  /** ✅ Tạo cấu hình range */
  create(setting: DepositSetting): Promise<any> {
    return lastValueFrom(this.httpClient.post(this.apiUrl + 'create', setting));
  }

  /** ✅ Cập nhật cấu hình range */
  update(setting: DepositSetting): Promise<any> {
    return lastValueFrom(this.httpClient.put(this.apiUrl + 'update', setting));
  }

  /** 🔹 Xóa mềm cấu hình range */
  softDelete(id: string, updated_by: string): Promise<any> {
    return lastValueFrom(
      this.httpClient.put(this.apiUrl + 'soft-delete/' + id, { updated_by })
    );
  }

  // ==================================================
  // ⭐ DEFAULT PERCENT – BẢN RIÊNG, KHÔNG LIÊN QUAN RANGE
  // ==================================================

  /** ⭐ Lấy default percent (trả về object: { default_percent: number }) */
  getDefault(): Promise<{ default_percent: number }> {
    return lastValueFrom(
      this.httpClient.get<{ default_percent: number }>(this.apiUrl + 'default')
    );
  }

  /** ⭐ Update default percent */
  updateDefault(default_percent: number, updated_by: string): Promise<any> {
    return lastValueFrom(
      this.httpClient.put(this.apiUrl + 'default', {
        default_percent,
        updated_by,
      })
    );
  }
}
