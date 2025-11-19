import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Career } from '../entities/career.entity';
import { SavedJob } from '../entities/saved-job.entity';

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy tất cả bài đăng tuyển dụng (ACTIVE) */
  async findAll(): Promise<Career[]> {
    return await lastValueFrom(
      this.httpClient.get<Career[]>(env.baseUrl + 'career')
    );
  }

  /** 🔹 Lấy chi tiết job */
  async findById(id: string): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.get<Career>(env.baseUrl + 'career/' + id)
    );
  }

  /** 🔹 Tạo bài đăng */
  async create(career: FormData): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.post<Career>(env.baseUrl + 'career', career)
    );
  }

  /** 🔹 Cập nhật job */
  async update(id: string, career: FormData): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.put<Career>(env.baseUrl + 'career/' + id, career)
    );
  }

  /** 🔹 Soft delete job (ẩn) */
  async delete(id: string): Promise<void> {
    return await lastValueFrom(
      this.httpClient.delete<void>(env.baseUrl + 'career/' + id)
    );
  }

  /** 🔹 Similar jobs */
  async findSimilarById(id: string): Promise<Career[]> {
    return await lastValueFrom(
      this.httpClient.get<Career[]>(env.baseUrl + 'career/similar/' + id)
    );
  }

  // ============================================================
  // 🚀 HÀM MỚI — DÀNH CHO HISTORY (is_active = false)
  // ============================================================

  /** 🔸 Lấy danh sách HISTORY (job bị xóa hoặc hết hạn) */
  async findHistory(): Promise<Career[]> {
    return await lastValueFrom(
      this.httpClient.get<Career[]>(env.baseUrl + 'career/history')
    );
  }

  /** 🔸 Khôi phục job đã xóa (is_active = true) */
  async restore(id: string): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.put<Career>(env.baseUrl + 'career/restore/' + id, {})
    );
  }

  /** 🔸 Xóa vĩnh viễn khỏi DB */
  async deletePermanent(id: string): Promise<void> {
    return await lastValueFrom(
      this.httpClient.delete<void>(
        env.baseUrl + 'career/delete-permanent/' + id
      )
    );
  }

  /** 🔹 Save job */
  async saveJob(user_id: string, job_id: string) {
    return await lastValueFrom(
      this.httpClient.post(env.baseUrl + 'savejob', { user_id, job_id })
    );
  }

  /** 🔹 Lấy danh sách job đã lưu của user */
  async getSavedJobs(user_id: string): Promise<SavedJob[]> {
    return await lastValueFrom(
      this.httpClient.get<SavedJob[]>(env.baseUrl + 'savejob/' + user_id)
    );
  }
}
