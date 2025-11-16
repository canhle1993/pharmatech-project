import {
  HttpStatus,
  Injectable,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountService } from '../account/account.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
  ) {}

  /** 🔐 Đăng nhập + check khóa 5 phút */
  async login(username: string, password: string) {
    const account =
      (await this.accountService.findByUsername(username)) ||
      (await this.accountService.findByEmail(username));

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    // 🔒 Kiểm tra khóa tạm thời
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      const mins = Math.ceil(
        (account.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new HttpException(
        `Account temporarily locked. Try again in ${mins} minute(s).`,
        HttpStatus.FORBIDDEN,
      );
    }

    // 🔓 Đã hết hạn khóa → mở lại
    if (account.lockedUntil && account.lockedUntil <= new Date()) {
      account.failedAttempts = 0;
      account.lockedUntil = null;
      account.is_active = true;
      await account.save();
    }

    // 🚫 Kiểm tra mật khẩu sai
    const isMatch = bcrypt.compareSync(password, account.password);
    if (!isMatch) {
      account.failedAttempts = (account.failedAttempts || 0) + 1;

      if (account.failedAttempts >= 5) {
        account.is_active = false;
        account.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
      }

      await account.save();

      throw new HttpException(
        account.failedAttempts >= 5
          ? 'Account locked for 5 minutes.'
          : `Invalid password. Attempts left: ${5 - account.failedAttempts}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 🟢 Đăng nhập OK
    account.failedAttempts = 0;
    account.lockedUntil = null;
    account.last_login = new Date();
    account.is_active = true;
    await account.save();

    const payload = {
      sub: account._id.toString(),
      email: account.email,
      roles: account.roles,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      account: {
        id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        last_login: account.last_login,
      },
    };
  }
}
