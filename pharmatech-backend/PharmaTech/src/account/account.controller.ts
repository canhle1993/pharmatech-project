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
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Account } from './account.decorator';
import { AccountDTO } from './account.dto';
import { plainToInstance } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // ===============================
  // 🔹 Danh sách / Tìm kiếm
  // ===============================
  @Get('find-all')
  async findAll() {
    return this.accountService.findAll();
  }

  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    const account = await this.accountService.findById(id);
    if (!account)
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    return account;
  }

  @Get('find-by-email/:email')
  async findByEmail(@Param('email') email: string) {
    const acc = await this.accountService.findByEmail(email);
    if (!acc) throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    return plainToInstance(AccountDTO, acc, {
      excludeExtraneousValues: true,
    });
  }

  @Get('find-by-username/:username')
  async findByUsername(@Param('username') username: string) {
    const acc = await this.accountService.findByUsername(username);
    return { exists: !!acc };
  }

  // ===============================
  // 🆕 Đăng ký tài khoản
  // ===============================
  @Post('create')
  async create(@Body() account: any) {
    account.is_active = false;
    account.securityCode = Math.floor(1000 + Math.random() * 9000).toString();
    account.otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000); // +5 phút

    const created = await this.accountService.create(account);
    if (!created)
      throw new HttpException(
        'Account registration failed',
        HttpStatus.BAD_REQUEST,
      );

    const sent = await this.mailService.send2(
      this.configService.get('mail_username'),
      account.email,
      'Verify your account at PharmaTech: ',
      `Your verification code: ${account.securityCode}`,
    );

    if (!sent)
      throw new HttpException(
        'Failed to send verification email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return {
      msg: 'Activation email sent successfully',
      otpExpiredAt: account.otpExpiredAt,
    };
  }

  // ===============================
  // ✅ Xác minh tài khoản
  // ===============================
  @Post('verify')
  async verify(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    const account = await this.accountService.findByEmail(email);
    if (!account)
      throw new HttpException('Email does not exist', HttpStatus.NOT_FOUND);

    // ⛔ Kiểm tra OTP hết hạn
    if (account.otpExpiredAt && new Date() > new Date(account.otpExpiredAt)) {
      throw new HttpException(
        'OTP expired. Please request a new one.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ⛔ Kiểm tra OTP đúng hay không
    if (account.securityCode !== otp)
      throw new HttpException('OTP is invalid', HttpStatus.BAD_REQUEST);

    // Nếu ok → kích hoạt
    account.is_active = true;
    account.securityCode = null;
    account.otpExpiredAt = null;

    await this.accountService.update(account._id.toString(), account);

    return { msg: 'Verification successful' };
  }

  // ===============================
  // 🔐 Đăng nhập
  // ===============================
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
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

    // 🔒 Kiểm tra khóa tạm thời
    if (acc.lockedUntil && acc.lockedUntil > new Date()) {
      const mins = Math.ceil((acc.lockedUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(
        `Account temporarily locked. Try again in ${mins} minute(s).`,
        HttpStatus.FORBIDDEN,
      );
    }

    // 🔓 Hết hạn khóa
    if (acc.lockedUntil && acc.lockedUntil <= new Date()) {
      acc.lockedUntil = null;
      acc.is_active = true;
      acc.failedAttempts = 0;
      await this.accountService.update(acc._id.toString(), acc);
    }

    // 🚫 Kiểm tra trạng thái kích hoạt
    if (!acc.is_active) {
      throw new HttpException(
        'Account is inactive. Please verify or contact admin.',
        HttpStatus.FORBIDDEN,
      );
    }

    // ✅ Kiểm tra mật khẩu
    const isValid = bcrypt.compareSync(password, acc.password);
    if (!isValid) {
      acc.failedAttempts = (acc.failedAttempts || 0) + 1;
      if (acc.failedAttempts >= 5) {
        acc.is_active = false;
        acc.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      }
      await this.accountService.update(acc._id.toString(), acc);

      throw new HttpException(
        acc.failedAttempts >= 5
          ? 'Account locked for 5 minutes.'
          : `Invalid password. Attempts left: ${5 - acc.failedAttempts}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ Đăng nhập thành công
    acc.failedAttempts = 0;
    acc.lockedUntil = null;
    acc.last_login = new Date();
    acc.is_active = true;
    await this.accountService.update(acc._id.toString(), acc);

    const dto = plainToInstance(AccountDTO, acc.toObject(), {
      excludeExtraneousValues: true,
    });

    return { msg: 'Login successful', account: dto };
  }

  // ===============================
  // 🧾 Upload ảnh & Resume
  // ===============================
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const unique = uuidv4().replace(/-/g, '');
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: `http://localhost:3000/upload/${file.filename}`,
    };
  }

  @Post('upload-resume')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const unique = uuidv4().replace(/-/g, '');
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: `http://localhost:3000/upload/${file.filename}`,
    };
  }

  // ===============================
  // ✏️ Cập nhật hồ sơ
  // ===============================

  @Patch('update/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    if (!id)
      throw new HttpException('Missing account ID', HttpStatus.BAD_REQUEST);
    const updated = await this.accountService.update(id, body);
    return { msg: 'Account updated successfully', data: updated };
  }

  // ===============================
  // 🔐 Quên mật khẩu / Reset
  // ===============================
  // ===============================
  // 🔐 QUÊN MẬT KHẨU
  // ===============================
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    const account: any = await this.accountService.findByEmail(email);
    if (!account) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Lưu OTP & thời gian hết hạn (5 phút)
    account.securityCode = otp;
    account.otpExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.accountService.update(account._id.toString(), account);

    // Gửi email
    const sent = await this.mailService.send2(
      this.configService.get('mail_username'),
      email,
      'Reset Password OTP',
      `Your OTP: ${otp} (valid for 5 minutes)`,
    );

    if (!sent) {
      throw new HttpException(
        'Failed to send OTP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      msg: 'OTP sent to email',
      otpExpiredAt: account.otpExpiredAt,
    };
  }

  // ===============================
  // 🔐 Kiểm tra OTP
  // ===============================
  @Post('verifyOtp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    const account: any = await this.accountService.findByEmail(email);

    if (!account)
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);

    // ⛔ OTP hết hạn
    if (account.otpExpiredAt && new Date() > new Date(account.otpExpiredAt)) {
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }

    // ⛔ OTP sai
    if (account.securityCode !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    // ✔ Nếu OTP ĐÚNG → reset lại các trường OTP
    account.securityCode = null;
    account.otpExpiredAt = null;

    await this.accountService.update(account._id.toString(), account);

    return { msg: 'OTP verified successfully' };
  }

  // ===============================
  // 🔐 Đổi mật khẩu sau khi verify OTP
  // ===============================
  @Post('resetPassword')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    const { email, newPassword } = body;

    const account: any = await this.accountService.findByEmail(email);
    if (!account)
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);

    const hashed = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
    account.password = hashed;

    // clear OTP
    account.securityCode = null;
    account.otpExpiredAt = null;

    await this.accountService.update(account._id.toString(), account);

    return { msg: 'Password reset successfully' };
  }

  // ===============================
  // 🗑️ Xóa mềm / Khôi phục
  // ===============================
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    const ok = await this.accountService.delete(id);
    if (!ok)
      throw new HttpException('Soft delete failed', HttpStatus.BAD_REQUEST);
    return { msg: 'Account marked as deleted successfully' };
  }

  @Patch('restore/:id')
  async restore(@Param('id') id: string) {
    const ok = await this.accountService.restore(id);
    if (!ok) throw new HttpException('Restore failed', HttpStatus.BAD_REQUEST);
    return { msg: 'Account restored successfully' };
  }

  // ===============================
  // 👑 Tạo admin
  // ===============================
  @Post('admin/create')
  async createAdmin(@Body() dto: any) {
    dto.password = bcrypt.hashSync(dto.password, bcrypt.genSaltSync());
    dto.roles = ['admin'];
    return this.accountService.create(dto);
  }

  @Get('find-by-role/:role')
  async findByRole(@Param('role') role: string) {
    try {
      return await this.accountService.findByRole(role);
    } catch (error) {
      throw new HttpException(
        'Failed to load accounts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
