import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AccountService } from './account.service';
import * as bcrypt from 'bcrypt';
import { Account } from './account.decorator';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AccountDTO } from './account.dto';
import { plainToInstance } from 'class-transformer';

@Controller('api/account')
export class AccountController {
  constructor(
    private accountService: AccountService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  @Get('find-all')
  findAll() {
    return this.accountService.findAll();
  }

  @Get('find-by-email/:email')
  async findByEmail(@Param('email') email: string) {
    let account = await this.accountService.findByEmail(email);
    if (account == null) {
      throw new HttpException('Email Not Found', HttpStatus.NOT_FOUND);
    } else {
      return account;
    }
  }

  @Get('find-by-username/:username')
  async findByUsername(@Param('username') username: string) {
    const acc = await this.accountService.findByUsername(username);
    if (acc) {
      return { exists: true }; // đã tồn tại
    }
    return { exists: false }; // chưa tồn tại
  }

  @Post('create')
  async create(@Body() account: Account) {
    account.password = bcrypt.hashSync(account.password, bcrypt.genSaltSync());
    account.is_active = false;
    account.securityCode = Math.floor(1000 + Math.random() * 9000).toString();
    if (await this.accountService.create(account)) {
      if (
        await this.mailService.send2(
          this.configService.get('mail_username'),
          account.email,
          'Verify',
          'Security Code: ' + account.securityCode,
        )
      ) {
        return {
          msg: 'Activation email sent successfully',
        };
      } else {
        throw new HttpException(
          {
            msg: 'Failed to send activation email',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new HttpException(
        {
          msg: 'Account registration failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('verify')
  async verify(@Body() body: any) {
    const email = body['email'];
    const otp = body['otp'];

    const account = await this.accountService.findByEmail(email);

    if (!account) {
      throw new HttpException('Email does not exist', HttpStatus.NOT_FOUND);
    }

    if (account.securityCode !== otp) {
      throw new HttpException('OTP is invalid', HttpStatus.BAD_REQUEST);
    }

    account.is_active = true;
    await this.accountService.update(account._id.toString(), account);

    return { msg: 'Verification successful' };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { username, password } = body;

    const isEmail = username.includes('@');
    const acc = isEmail
      ? await this.accountService.findByEmail(username)
      : await this.accountService.findByUsername(username);

    if (!acc) {
      throw new HttpException(
        isEmail ? 'Email not found' : 'Username not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // ✅ Nếu tài khoản đang bị khóa tạm thời
    if (acc.lockedUntil && acc.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (acc.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new HttpException(
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Nếu hết thời gian khóa → tự mở khóa
    if (acc.lockedUntil && acc.lockedUntil <= new Date()) {
      acc.lockedUntil = null;
      acc.is_active = true;
      acc.failedAttempts = 0;
      await this.accountService.update(acc._id.toString(), acc);
    }

    // Nếu tài khoản bị khóa thủ công (is_active = false)
    if (!acc.is_active) {
      throw new HttpException(
        'Account locked due to too many failed attempts. Please reset your password.',
        HttpStatus.FORBIDDEN,
      );
    }

    const isValid = bcrypt.compareSync(password, acc.password);

    // ✅ Nếu mật khẩu sai
    if (!isValid) {
      acc.failedAttempts = (acc.failedAttempts || 0) + 1;

      // Nếu sai >= 5 lần → khóa 5 phút
      if (acc.failedAttempts >= 5) {
        acc.is_active = false;
        acc.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
      }

      await this.accountService.update(acc._id.toString(), acc);

      const msg =
        acc.failedAttempts >= 5
          ? 'Account locked for 5 minutes due to too many failed attempts.'
          : `Invalid password. Attempts left: ${5 - acc.failedAttempts}`;

      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }

    // ✅ Nếu đăng nhập thành công → reset lại failedAttempts và mở khóa nếu có
    acc.failedAttempts = 0;
    acc.lockedUntil = null;
    acc.last_login = new Date();
    acc.is_active = true;
    await this.accountService.update(acc._id.toString(), acc);

    return {
      msg: 'Login successful',
      account: acc,
    };
  }

  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const account = await this.accountService.findById(id);
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    // ✅ Dùng class-transformer để convert sang DTO (đảm bảo photo có URL đầy đủ)
    return plainToInstance(AccountDTO, account, { excludeExtraneousValues: true });
  }


  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4().replace(/-/g, '');
          const extension = extname(file.originalname);
          cb(null, uniqueName + extension);
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: 'http://localhost:3000/upload/' + file.filename,
    };
  }

  @Patch('update/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    const updated = await this.accountService.update(id, body);
    return updated;
  }

  // =========================
  // 🔹 FORGOT PASSWORD
  // =========================
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    const account = await this.accountService.findByEmail(email);
    if (!account) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    // Sinh OTP ngẫu nhiên 4 chữ số
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    account.securityCode = otp;

    await this.accountService.update(account._id.toString(), account);

    const sent = await this.mailService.send2(
      this.configService.get('mail_username'),
      email,
      'Reset Password OTP',
      'Your OTP for password reset: ' + otp,
    );

    if (!sent) {
      throw new HttpException(
        'Failed to send OTP to email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { msg: 'OTP has been sent to your email' };
  }

  // =========================
  // 🔹 VERIFY OTP
  // =========================
  @Post('verifyOtp')
  async verifyOtp(@Body() body: any) {
    const { email, otp } = body;
    const account = await this.accountService.findByEmail(email);
    if (!account) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    if (account.securityCode !== otp) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    return { msg: 'OTP verified successfully' };
  }

  // =========================
  // 🔹 RESET PASSWORD
  // =========================
  @Post('resetPassword')
  async resetPassword(@Body() body: any) {
    const { email, newPassword } = body;
    const account = await this.accountService.findByEmail(email);

    if (!account) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    if (!account.securityCode) {
      throw new HttpException('OTP not verified', HttpStatus.BAD_REQUEST);
    }

    const hashed = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
    account.password = hashed;
    account.securityCode = null; // clear OTP

    await this.accountService.update(account._id.toString(), account);

    return { msg: 'Password has been reset successfully' };
  }

  // account.controller.ts
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    const result = await this.accountService.delete(id);
    if (!result) {
      throw new HttpException('Delete failed', HttpStatus.BAD_REQUEST);
    }
    return { msg: 'Deleted successfully' };
  }

  @Post('admin/create')
  async createAdmin(@Body() dto: any) { // 👈 dùng any
    try {
      dto.password = bcrypt.hashSync(dto.password, bcrypt.genSaltSync());
      dto.roles = ['admin'];
      return await this.accountService.create(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

}
