import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Lấy tất cả bài đăng tuyển dụng (cho admin + user) */
  findAll() {
    return lastValueFrom(this.httpClient.get(env.baseUrl + 'career'));
  }

  /** 🔹 Lấy chi tiết 1 bài đăng theo ID */
  findById(id: string) {
    return lastValueFrom(this.httpClient.get(env.baseUrl + 'career/' + id));
  }

  /** 🔹 Tạo bài đăng mới (có upload banner) */
  create(career: FormData) {
    return lastValueFrom(this.httpClient.post(env.baseUrl + 'career', career));
  }

  /** 🔹 Cập nhật bài đăng (có thể thay banner) */
  update(id: string, career: FormData) {
    return lastValueFrom(
      this.httpClient.put(env.baseUrl + 'career/' + id, career)
    );
  }

  /** 🔹 Ẩn (xóa mềm) bài đăng */
  delete(id: string) {
    return lastValueFrom(this.httpClient.delete(env.baseUrl + 'career/' + id));
  }
}
