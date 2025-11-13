import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Application } from '../entities/application.entity';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  constructor(private httpClient: HttpClient) {}

  /** 🟢 Tạo mới đơn ứng tuyển */
  async create(app: Application): Promise<Application> {
    return await lastValueFrom(
      this.httpClient.post<Application>(env.baseUrl + 'application/create', app)
    );
  }

  /** 🟢 Lấy toàn bộ danh sách hồ sơ ứng tuyển */
  async findAll(): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(env.baseUrl + 'application/find-all')
    );
  }

  /** 🟢 Lấy danh sách ứng tuyển theo account */
  async findByAccount(account_id: string): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(
        env.baseUrl + 'application/find-by-account/' + account_id
      )
    );
  }

  /** 🟢 Lấy danh sách ứng tuyển theo career (job) */
  async findByCareer(career_id: string): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(
        env.baseUrl + 'application/find-by-career/' + career_id
      )
    );
  }

  /** 🟢 Cập nhật trạng thái hồ sơ (admin dùng) */
  async updateStatus(
    id: string,
    status: string,
    note?: string
  ): Promise<Application> {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/update-status/' + id,
        { status, note }
      )
    );
  }

  /** 🧑‍💼 SuperAdmin → Phân công admin phụ trách */
  async assignAdmin(
    id: string,
    admin_id: string,
    admin_name: string
  ): Promise<Application> {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/assign/' + id,
        { admin_id, admin_name } // ✅ khớp với BE
      )
    );
  }

  /** 📅 Admin → Lên lịch phỏng vấn */
  async scheduleInterview(
    id: string,
    interview_date: string,
    interview_location: string,
    interview_note?: string
  ): Promise<Application> {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/schedule/' + id,
        { interview_date, interview_location, interview_note }
      )
    );
  }

  /** ✅ Admin → Cập nhật kết quả phỏng vấn */
  async updateResult(
    id: string,
    result: string,
    hired_department?: string,
    hired_start_date?: string
  ): Promise<Application> {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/result/' + id,
        { result, hired_department, hired_start_date }
      )
    );
  }

  /** 🗑️ Xóa hồ sơ ứng tuyển */
  async delete(id: string): Promise<void> {
    return await lastValueFrom(
      this.httpClient.delete<void>(env.baseUrl + 'application/delete/' + id)
    );
  }

  /** 🧾 Lấy danh sách admin (role = 'admin') */
  async findAllAdmins(): Promise<any[]> {
    return await lastValueFrom(
      this.httpClient.get<any[]>(env.baseUrl + 'account/find-by-role/admin')
    );
  }
}
