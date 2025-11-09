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
  // 🔹 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy tất cả cấu hình đặt cọc */
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

  /** 🔹 Lấy danh sách cấu hình đang active */
  findActive(): Promise<DepositSetting[]> {
    return lastValueFrom(
      this.httpClient.get<DepositSetting[]>(this.apiUrl + 'find-active')
    );
  }

  // ==================================================
  // 🧾 TẠO / CẬP NHẬT / XÓA
  // ==================================================

  /** ✅ Tạo cấu hình đặt cọc mới */
  create(setting: DepositSetting): Promise<any> {
    return lastValueFrom(this.httpClient.post(this.apiUrl + 'create', setting));
  }

  /** ✅ Cập nhật cấu hình đặt cọc */
  update(setting: DepositSetting): Promise<any> {
    return lastValueFrom(this.httpClient.put(this.apiUrl + 'update', setting));
  }

  /** 🔹 Xóa mềm cấu hình đặt cọc */
  softDelete(id: string, updated_by: string): Promise<any> {
    return lastValueFrom(
      this.httpClient.put(this.apiUrl + 'soft-delete/' + id, { updated_by })
    );
  }
}
