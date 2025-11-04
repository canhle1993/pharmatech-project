import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy tất cả sản phẩm (mới nhất lên đầu, bỏ soft delete) */
  findAll() {
    return lastValueFrom(this.httpClient.get(env.baseUrl + 'product/find-all'));
  }

  /** 🔹 Lấy danh sách sản phẩm đang hoạt động */
  findAllActive() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-active')
    );
  }

  /** 🔹 Tìm theo từ khóa (name hoặc model) */
  findByKeyword(keyword: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-by-keyword/' + keyword)
    );
  }

  /** 🔹 Tìm theo ID (kèm gallery ảnh phụ + category) */
  findById(id: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/find-by-id/' + id)
    );
  }

  // ==================================================
  // 🧾 TẠO SẢN PHẨM (CÓ ẢNH CHÍNH + CATEGORY)
  // ==================================================
  create(product: any, mainFile?: File) {
    const formData = new FormData();

    // 🔸 Thêm field text
    formData.append('name', product.name);
    formData.append('model', product.model || '');
    formData.append('description', product.description || '');
    formData.append('specification', product.specification || '');
    formData.append('price', product.price ? product.price.toString() : '0');
    formData.append('manufacturer', product.manufacturer || '');
    formData.append('updated_by', product.updated_by || 'admin');

    // 🔸 Thêm danh sách category_ids (mảng)
    if (product.category_ids && product.category_ids.length > 0) {
      formData.append('category_ids', JSON.stringify(product.category_ids));
    }

    // 🔸 Ảnh chính
    if (mainFile) {
      formData.append('file', mainFile);
    }

    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'product/create', formData)
    );
  }

  // ==================================================
  // 🧾 CẬP NHẬT SẢN PHẨM (CÓ ẢNH CHÍNH + CATEGORY)
  // ==================================================
  update(product: any, mainFile?: File) {
    const formData = new FormData();

    formData.append('id', product.id);
    formData.append('name', product.name);
    formData.append('model', product.model || '');
    formData.append('description', product.description || '');
    formData.append('specification', product.specification || '');
    formData.append('price', product.price ? product.price.toString() : '0');
    formData.append('manufacturer', product.manufacturer || '');
    formData.append('updated_by', product.updated_by || 'admin');

    if (product.category_ids && product.category_ids.length > 0) {
      formData.append('category_ids', JSON.stringify(product.category_ids));
    }

    if (mainFile) {
      formData.append('file', mainFile);
    }

    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/update', formData)
    );
  }

  /** 🔹 Xóa mềm (soft delete) */
  softDelete(id: string, updated_by: string) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/soft-delete/' + id, {
        updated_by,
      })
    );
  }

  // ==================================================
  // 📸 Upload ảnh phụ (gallery) riêng biệt cho sản phẩm
  // ==================================================
  uploadGallery(productId: string, files: File[]) {
    const formData = new FormData();
    formData.append('product_id', productId);
    files.forEach((file) => formData.append('files', file)); // ✅ key phải là "files"

    return lastValueFrom(
      this.httpClient.post(
        env.baseUrl + 'product-image/upload-gallery',
        formData
      )
    );
  }

  /** 🔹 Xóa ảnh phụ theo ID ảnh */
  deleteGalleryImage(imageId: string) {
    return lastValueFrom(
      this.httpClient.delete(env.baseUrl + 'product-image/delete/' + imageId)
    );
  }
}
