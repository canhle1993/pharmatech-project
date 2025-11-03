import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy danh sách tất cả sản phẩm (chưa xóa, mới nhất lên đầu) */
  findAll() {
    return lastValueFrom(this.httpClient.get(env.baseUrl + 'product/find-all'));
  }

  /** 🔹 Tìm sản phẩm theo từ khóa (name hoặc model) */
  findByKeyword(keyword: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-by-keyword/' + keyword)
    );
  }

  /** 🔹 Tìm sản phẩm theo ID */
  findById(id: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-by-id/' + id)
    );
  }

  /** 🔹 Tạo mới sản phẩm */
  create(product: any) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'product/create', product)
    );
  }

  /** 🔹 Cập nhật sản phẩm */
  update(product: any) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/update', product)
    );
  }

  /** 🔹 Xóa mềm sản phẩm (soft delete) */
  softDelete(id: string, updated_by: string) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/soft-delete/' + id, {
        updated_by,
      })
    );
  }

  /** 🔹 Upload hình ảnh sản phẩm */
  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'product/upload', formData)
    );
  }

  /** 🔹 Lấy danh sách sản phẩm chưa bị xóa mềm */
  findAllActive() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-active')
    );
  }
}
