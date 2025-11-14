import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountService } from '../account/account.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
  ) {}

  /** 🟢 Đăng nhập và sinh JWT */
  async login(username: string, password: string) {
    // 🔍 Lấy tài khoản từ DB
    // Cho phép đăng nhập bằng username hoặc email
    const account =
      (await this.accountService.findByUsername(username)) ||
      (await this.accountService.findByEmail(username));

    if (!account) throw new UnauthorizedException('Account not found');

    // 🔐 Kiểm tra mật khẩu
    const isMatch = bcrypt.compareSync(password, account.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // ⚙️ Payload chứa roles, id, email
    const payload = {
      sub: account._id.toString(),
      email: account.email,
      roles: account.roles,
    };

    // 🧾 Sinh token
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
      },
    };
  }
}
