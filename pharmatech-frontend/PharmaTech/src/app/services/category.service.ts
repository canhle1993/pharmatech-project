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

  /** 🔹 Tạo mới category có upload ảnh và liên kết product */
  create(category: any, file?: File) {
    const formData = new FormData();

    // Thêm các trường text
    formData.append('name', category.name);
    formData.append('description', category.description || '');
    formData.append('updated_by', category.updated_by || 'admin');

    // ✅ Nếu có danh sách product_ids (1 hoặc nhiều)
    if (category.product_ids && category.product_ids.length > 0) {
      // Nếu là mảng, convert sang JSON string để backend parse lại
      formData.append('product_ids', JSON.stringify(category.product_ids));
    }

    // ✅ Thêm file nếu có
    if (file) {
      formData.append('file', file);
    }

    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'category/create', formData)
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

  /** 🔹 Lấy danh sách product thuộc 1 category */
  findProductsByCategory(categoryId: string) {
    return lastValueFrom(
      this.httpClient.get(
        env.baseUrl + 'product-category/find-products-by-category/' + categoryId
      )
    );
  }
}
