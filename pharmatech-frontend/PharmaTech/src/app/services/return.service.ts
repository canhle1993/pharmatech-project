import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReturnService {
  private baseUrl = env.baseUrl + 'returns/';

  constructor(private http: HttpClient) {}

  // 🔍 Lấy tất cả hoặc filter theo status
  async findAll(status?: string): Promise<any[]> {
    const url = status
      ? `${this.baseUrl}find-all?status=${status}`
      : `${this.baseUrl}find-all`;

    const res: any = await lastValueFrom(this.http.get<any>(url));

    return res.data || res || []; // API chuẩn
  }

  async findById(id: string): Promise<any> {
    return await lastValueFrom(
      this.http.get<any>(`${this.baseUrl}find-by-id/${id}`)
    );
  }

  // ➕ Tạo yêu cầu đổi hàng
  async create(payload: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(`${this.baseUrl}create`, payload)
    );
  }

  // 📤 Upload ảnh hư hại
  async uploadDamage(file: File): Promise<any> {
    const form = new FormData();
    form.append('file', file);
    return await lastValueFrom(
      this.http.post(`${this.baseUrl}upload-damage`, form)
    );
  }

  // 🔄 Admin: Mark Completed
  async markCompleted(id: string, updated_by: string): Promise<any> {
    return await lastValueFrom(
      this.http.put(`${this.baseUrl}mark-completed/${id}`, { updated_by })
    );
  }

  // 🗑️ Soft delete
  async softDelete(id: string, updated_by: string): Promise<any> {
    return await lastValueFrom(
      this.http.put(`${this.baseUrl}soft-delete/${id}`, { updated_by })
    );
  }
}
