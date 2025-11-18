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
    formData.append('introduce', product.introduce || '');
    formData.append('updated_by', product.updated_by || 'admin');

    /** ✅ Thêm quản lý tồn kho */
    formData.append(
      'stock_quantity',
      product.stock_quantity ? product.stock_quantity.toString() : '0'
    );
    formData.append('stock_status', product.stock_status || 'in_stock');

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
  update(product: any, mainFile?: File, galleryFiles?: File[]) {
    const formData = new FormData();

    // 🧾 Thông tin cơ bản
    formData.append('id', product.id);
    formData.append('name', product.name);
    formData.append('model', product.model || '');
    formData.append('description', product.description || '');
    formData.append('specification', product.specification || '');
    formData.append('price', product.price ? product.price.toString() : '0');
    formData.append('introduce', product.introduce || '');
    formData.append('updated_by', product.updated_by || 'admin');

    /** ✅ Thêm quản lý tồn kho */
    formData.append(
      'stock_quantity',
      product.stock_quantity ? product.stock_quantity.toString() : '0'
    );
    formData.append('stock_status', product.stock_status || 'in_stock');

    // 🏷️ Danh mục (category)
    if (product.category_ids && product.category_ids.length > 0) {
      formData.append('category_ids', JSON.stringify(product.category_ids));
    }

    // 🖼️ Ảnh chính
    if (mainFile) {
      formData.append('file', mainFile);
    }

    // 📸 Ảnh gallery (nếu có thêm)
    if (galleryFiles && galleryFiles.length > 0) {
      galleryFiles.forEach((file) => formData.append('gallery', file));
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

  // 📉 TRỪ TỒN KHO SẢN PHẨM SAU KHI ĐẶT HÀNG THÀNH CÔNG
  // ==================================================
  async reduceStock(productId: string, quantity: number): Promise<any> {
    return await lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/reduce-stock/' + productId, {
        quantity,
      })
    );
  }

  /** 🔹 Tab 1: Sản phẩm còn hàng (stock_quantity > 0) */
  getProductsInStock() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/stock/in-stock')
    );
  }

  /** 🔹 Tab 2: Sản phẩm hết hàng (stock_quantity = 0) */
  getProductsOutOfStock() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'product/stock/out-of-stock')
    );
  }

  /** 🟩 Nhập kho: cộng thêm số lượng mới */
  updateStock(productId: string, added_quantity: number, updated_by: string) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/update-stock/' + productId, {
        added_quantity,
        updated_by,
      })
    );
  }

  getTopSelling(): Promise<any[]> {
    return lastValueFrom(
      this.httpClient.get<any[]>(env.baseUrl + 'product/top-selling')
    );
  }

  getNewestProducts(): Promise<any[]> {
    return lastValueFrom(
      this.httpClient.get<any[]>(env.baseUrl + 'product/newest')
    );
  }

  getTopOneSelling(): Promise<any> {
    return lastValueFrom(
      this.httpClient.get<any>(env.baseUrl + 'product/top-one')
    );
  }
}
