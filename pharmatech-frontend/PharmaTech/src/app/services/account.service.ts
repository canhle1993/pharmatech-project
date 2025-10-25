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

  /** 🔹 Xác thực tài khoản qua email + OTP */
  verify(email: string, otp: string) {
    return lastValueFrom(
      this.httpClient.post(env.baseUrl + 'account/verify', { email, otp })
    );
  }

  /** 🔹 Đăng nhập */
  async login(username: string, password: string) {
    const res: any = await lastValueFrom(
      this.httpClient.post(`${env.baseUrl}account/login`, {
        username,
        password,
      })
    );

    if (res.account) {
      localStorage.setItem('currentUser', JSON.stringify(res.account));
    }

    return res;
  }

  /** 🔹 Đăng xuất */
  logout() {
    localStorage.removeItem('currentUser');
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
}
