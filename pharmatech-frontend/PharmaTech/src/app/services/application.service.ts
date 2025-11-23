import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';
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

  /** 🟢 Lấy danh sách ACTIVE */
  async findAll(): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(env.baseUrl + 'application/find-all')
    );
  }

  /** 🟣 Lấy danh sách HISTORY */
  async findHistory(): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(env.baseUrl + 'application/history')
    );
  }

  /** 🔄 Khôi phục hồ sơ (RESTORE) */
  async restore(id: string) {
    return await lastValueFrom(
      this.httpClient.put(env.baseUrl + 'application/restore/' + id, {})
    );
  }

  /** ☠️ Xóa vĩnh viễn */
  async deletePermanent(id: string) {
    return await lastValueFrom(
      this.httpClient.delete(env.baseUrl + 'application/delete-permanent/' + id)
    );
  }

  /** 🟡 Xóa mềm – Chuyển vào HISTORY */
  async softDelete(id: string) {
    return await lastValueFrom(
      this.httpClient.delete(env.baseUrl + 'application/' + id)
    );
  }

  /** 🟢 Lấy danh sách theo account */
  // ApplicationService (FE)
  async findByAccount(account_id: string): Promise<Application[]> {
    const apps = await lastValueFrom(
      this.httpClient.get<Application[]>(
        env.baseUrl + 'application/find-by-account/' + account_id
      )
    );

    // ⭐ Gắn full URL cho banner
    return apps.map((app: any) => {
      if (app.career_id?.banner) {
        app.career_id.banner = env.imageUrl + app.career_id.banner;
      }
      return app;
    });
  }

  /** 🟢 Lấy danh sách theo career */
  async findByCareer(career_id: string): Promise<Application[]> {
    return await lastValueFrom(
      this.httpClient.get<Application[]>(
        env.baseUrl + 'application/find-by-career/' + career_id
      )
    );
  }

  /** 🧠 Cập nhật trạng thái */
  async updateStatus(id: string, status: string, note?: string) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/update-status/' + id,
        { status, note }
      )
    );
  }

  /** 🧑‍💼 Phân công admin */
  async assignAdmin(id: string, admin_id: string, admin_name: string) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/assign/' + id,
        { admin_id, admin_name }
      )
    );
  }

  /** ✉ Lấy template email */
  async getEmailTemplate(id: string): Promise<string> {
    const res = await lastValueFrom(
      this.httpClient.get<{ template: string }>(
        env.baseUrl + 'application/generate-template/' + id
      )
    );
    return res.template;
  }

  /** 📅 Lên lịch phỏng vấn */
  async scheduleInterview(
    id: string,
    date: string,
    location: string,
    email_content: string
  ) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/schedule/' + id,
        { date, location, email_content }
      )
    );
  }

  /** 🟪 Update hired result */
  async updateResult(
    id: string,
    result: string,
    hired_department?: string,
    hired_start_date?: string
  ) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/result/' + id,
        { result, hired_department, hired_start_date }
      )
    );
  }

  /** Admin list (ÔN GIỮ NGUYÊN) */
  async findAllAdmins() {
    return await lastValueFrom(
      this.httpClient.get<any[]>(env.baseUrl + 'account/find-by-role/admin')
    );
  }

  // ===============================
  // 🟩 PASS
  // ===============================
  async markAsPass(
    id: string,
    start_work_date: string,
    location: string,
    email_content: string
  ) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/mark-pass/' + id,
        {
          start_work_date,
          location,
          email_content,
        }
      )
    );
  }

  async getPassEmailTemplate(id: string): Promise<string> {
    const res = await lastValueFrom(
      this.httpClient.get<{ template: string }>(
        env.baseUrl + 'application/generate-pass-template/' + id
      )
    );
    return res.template;
  }

  /** ============================
   * 🟥 REJECT
   ============================ */
  async markAsReject(
    id: string,
    reason: string,
    email_content: string,
    rejected_by: string
  ) {
    return await lastValueFrom(
      this.httpClient.patch<Application>(
        env.baseUrl + 'application/mark-reject/' + id,
        {
          reason,
          email_content,
          rejected_by,
        }
      )
    );
  }

  async getRejectEmailTemplate(id: string): Promise<string> {
    const res = await lastValueFrom(
      this.httpClient.get<{ template: string }>(
        env.baseUrl + 'application/generate-reject-template/' + id
      )
    );
    return res.template;
  }

  async checkDuplicate(user_id: string, career_id: string) {
    return await lastValueFrom(
      this.httpClient.get<{ applied: boolean }>(
        `${env.baseUrl}application/check-duplicate`,
        {
          params: {
            user_id,
            career_id,
          },
        }
      )
    );
  }

  /** 🔴 LẤY SỐ LƯỢNG APPLICATION PENDING */
  async getPendingCount(): Promise<{ count: number }> {
    return await lastValueFrom(
      this.httpClient.get<{ count: number }>(
        env.baseUrl + 'application/pending-count'
      )
    );
  }
}
