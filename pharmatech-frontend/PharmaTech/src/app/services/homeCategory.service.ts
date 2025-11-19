import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomeCategoryService {
  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // 🔹 LẤY THÔNG TIN CATEGORY TRANG HOME
  // ==================================================
  find() {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'settings/home-categories')
    );
  }

  // ==================================================
  // 🔹 LƯU / CẬP NHẬT CATEGORY TRANG HOME
  // ==================================================
  save(data: {
    category1: string | null;
    category2: string | null;
    category3: string | null;
  }) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'settings/home-categories', data)
    );
  }
}
