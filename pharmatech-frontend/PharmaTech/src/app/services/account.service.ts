import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private httpClient: HttpClient) {}

  /** 🔹 Đăng ký tài khoản mới */
  create(account: any) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/create', account)
    );
  }

  /** 🔹 Tạo tài khoản admin */
  async createAdmin(account: any): Promise<any> {
    return await lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/admin/create', account)
    );
  }

  /** 🔹 Xác thực tài khoản qua email + OTP */
  verify(email: string, otp: string) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/verify', { email, otp })
    );
  }

  /** 🔹 Đăng nhập */
  async login(username: string, password: string) {
    const res: any = await lastValueFrom(
      this.httpClient.post(`${env.baseUrl}auth/login`, { username, password })
    );

    if (res?.access_token) {
      // Lưu token thật
      localStorage.setItem('token', res.access_token);

      // Lưu thông tin user
      localStorage.setItem('currentUser', JSON.stringify(res.account));

      localStorage.setItem('userId', res.account.id || res.account._id || '');
      localStorage.setItem('userName', res.account.name || '');
      localStorage.setItem('userEmail', res.account.email || '');
      localStorage.setItem('userRole', JSON.stringify(res.account.roles || []));

      localStorage.setItem(
        'chatUserId',
        res.account.id || res.account._id || ''
      );
    }

    // if (res.account) {
    //   localStorage.setItem('chatUserId', res.account._id);
    // }

    return res;
  }

  /** 🔹 Đăng xuất */
  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('chatUserId');
    sessionStorage.clear();
  }

  sendOtp(email: string) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/forgotPassword', { email })
    );
  }

  verifyOtp(email: string, otp: string) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/verifyOtp', { email, otp })
    );
  }

  resetPassword(email: string, newPassword: string) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/resetPassword', {
        email,
        newPassword,
      })
    );
  }

  checkUsername(username: string) {
    return lastValueFrom(
      this.httpClient.get<{ exists: boolean }>(
        env.baseUrl + 'account/find-by-username/' + username
      )
    );
  }

  findAll() {
    return lastValueFrom(this.httpClient.get(env.baseUrl + 'account/find-all'));
  }

  delete(id: string) {
    return lastValueFrom(
      this.httpClient.delete(env.baseUrl + 'account/delete/' + id)
    );
  }

  updateStatus(id: string, isActive: boolean) {
    return lastValueFrom(
      this.httpClient.patch(env.baseUrl + 'account/update/' + id, {
        is_active: isActive,
      })
    );
  }

  async findById(id: string): Promise<any> {
    return await lastValueFrom(
      this.httpClient.get(env.baseUrl + 'account/find-by-id/' + id)
    );
  }

  // 🔹 Update account info
  async update(id: string, account: any): Promise<any> {
    return await lastValueFrom(
      this.httpClient.patch(env.baseUrl + 'account/update/' + id, account)
    );
  }

  // 🔹 Upload avatar (photo)
  async uploadPhoto(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return await lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/upload', formData)
    );
  }

  // 🔹 Upload resume (CV)
  async uploadResume(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return await lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/upload-resume', formData)
    );
  }

  /** 🗑️ Xóa mềm tài khoản (soft delete) */
  async softDelete(id: string): Promise<any> {
    return await lastValueFrom(
      this.httpClient.delete(`${env.baseUrl}account/delete/${id}`)
    );
  }

  /** ♻️ Khôi phục tài khoản đã xóa (restore) */
  async restore(id: string): Promise<any> {
    return await lastValueFrom(
      this.httpClient.patch(`${env.baseUrl}account/restore/${id}`, {})
    );
  }
  async findByEmail(email: string) {
    return lastValueFrom(
      this.httpClient.get(env.baseUrl + 'account/find-by-email/' + email)
    );
  }
}
