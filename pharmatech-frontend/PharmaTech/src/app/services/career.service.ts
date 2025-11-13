import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Career } from '../entities/career.entity'; // 🟢 import entity

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy tất cả bài đăng tuyển dụng (cho admin + user) */
  async findAll(): Promise<Career[]> {
    return await lastValueFrom(
      this.httpClient.get<Career[]>(env.baseUrl + 'career')
    );
  }

  /** 🔹 Lấy chi tiết 1 bài đăng theo ID */
  async findById(id: string): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.get<Career>(env.baseUrl + 'career/' + id)
    );
  }

  /** 🔹 Tạo bài đăng mới (có upload banner) */
  async create(career: FormData): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.post<Career>(env.baseUrl + 'career', career)
    );
  }

  /** 🔹 Cập nhật bài đăng (có thể thay banner) */
  async update(id: string, career: FormData): Promise<Career> {
    return await lastValueFrom(
      this.httpClient.put<Career>(env.baseUrl + 'career/' + id, career)
    );
  }

  /** 🔹 Xóa bài đăng (hoặc ẩn mềm) */
  async delete(id: string): Promise<void> {
    return await lastValueFrom(
      this.httpClient.delete<void>(env.baseUrl + 'career/' + id)
    );
  }

  /** 🔹 Lấy danh sách job tương tự */
  async findSimilarById(id: string): Promise<Career[]> {
    return await lastValueFrom(
      this.httpClient.get<Career[]>(env.baseUrl + 'career/similar/' + id)
    );
  }
}
