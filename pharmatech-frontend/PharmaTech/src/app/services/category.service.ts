import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy danh sách tất cả category (loại bỏ xóa mềm, sắp xếp mới nhất) */
  findAll() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'category/find-all')
    );
  }

  /** 🔹 Tìm theo từ khóa */
  findByKeyword(keyword: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'category/find-by-keyword/' + keyword)
    );
  }

  /** 🔹 Tìm theo ID */
  findById(id: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'category/find-by-id/' + id)
    );
  }

  /** 🔹 Tạo mới category */
  create(category: any) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'category/create', category)
    );
  }

  /** 🔹 Cập nhật category */
  update(category: any) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'category/update', category)
    );
  }

  /** 🔹 Xóa mềm category (soft delete) */
  softDelete(id: string, updated_by: string) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'category/soft-delete/' + id, {
        updated_by,
      })
    );
  }
}
