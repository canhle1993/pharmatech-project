import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { Account } from './account.decorator';
import { AccountDTO } from './account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
  ) {}

  /** 🟢 Lấy danh sách tất cả account */
  async findAll(): Promise<AccountDTO[]> {
    const accounts = await this.accountModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .lean();

    return accounts.map((a) =>
      plainToInstance(AccountDTO, a, { excludeExtraneousValues: true }),
    );
  }

  /** 🔍 Tìm account theo ID */
  async findById(id: string): Promise<AccountDTO> {
    const account = await this.accountModel.findById(id).lean();
    if (!account) throw new NotFoundException('Account not found');
    return plainToInstance(AccountDTO, account, {
      excludeExtraneousValues: true,
    });
  }

  /** 🔍 Tìm theo email */
  async findByEmail(email: string): Promise<Account | null> {
    return this.accountModel.findOne({ email }).exec();
  }

  /** 🔍 Tìm theo username */
  async findByUsername(username: string): Promise<Account | null> {
    return this.accountModel.findOne({ username }).exec();
  }

  /** 🆕 Tạo tài khoản mới */
  async create(account: Account): Promise<AccountDTO> {
    try {
      const hashed = bcrypt.hashSync(account.password, bcrypt.genSaltSync());
      const created = await this.accountModel.create({
        ...account,
        password: hashed,
        is_active: true,
      });

      return plainToInstance(AccountDTO, created.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      throw new HttpException(
        'Error creating account: ' + err.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** ✏️ Cập nhật hồ sơ người dùng */
  async update(id: string, account: Partial<Account>): Promise<AccountDTO> {
    const exists = await this.accountModel.findById(id);
    if (!exists) throw new NotFoundException('Account not found');

    const data: any = {
      // 👤 Thông tin cá nhân
      name: account.name,
      phone: account.phone,
      email: account.email,
      address: account.address,
      gender: account.gender,
      dob: account.dob,

      photo:
        account.photo && !account.photo.startsWith('http')
          ? `${account.photo}`
          : account.photo || exists.photo,

      // 📄 Hồ sơ ứng tuyển
      resume: account.resume,
      introduction: account.introduction,
      expected_salary: account.expected_salary,
      job_type: account.job_type,
      available_from: account.available_from,

      // 🧠 Kỹ năng, lĩnh vực, khu vực mong muốn
      skills: account.skills || [],
      languages: account.languages || [],
      field: account.field || [],
      preferred_area: account.preferred_area || '',

      // 🎓 Học vấn
      education: {
        education_level: account.education?.education_level || '',
        major: account.education?.major || '',
        school_name: account.education?.school_name || '',
        graduation_year: account.education?.graduation_year || null,
      },

      // 💼 Kinh nghiệm
      experience: {
        company_name: account.experience?.company_name || '',
        job_title: account.experience?.job_title || '',
        working_years: account.experience?.working_years || null,
        responsibilities: account.experience?.responsibilities || '',
      },
    };

    const updated = await this.accountModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    );

    return plainToInstance(AccountDTO, updated.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🔐 Đăng nhập */
  async login(
    username: string,
    password: string,
  ): Promise<{ msg: string; account: AccountDTO } | null> {
    const acc = await this.accountModel.findOne({ username }).exec();
    if (!acc || !acc.is_active || !bcrypt.compareSync(password, acc.password)) {
      return null;
    }

    // cập nhật last_login
    acc.last_login = new Date();
    await acc.save();

    const dto = plainToInstance(AccountDTO, acc.toObject(), {
      excludeExtraneousValues: true,
    });

    return { msg: 'Login successful', account: dto };
  }

  /** 🔑 Gán mã bảo mật (OTP, xác minh, v.v.) */
  async setSecurityCode(email: string, code: string) {
    const acc = await this.accountModel.findOne({ email }).exec();
    if (acc) {
      acc.securityCode = code;
      await acc.save();
    }
  }

  /** 🗑️ Xóa mềm */
  async delete(id: string): Promise<boolean> {
    const res = await this.accountModel.updateOne(
      { _id: id },
      { $set: { is_delete: true } },
    );
    return res.modifiedCount > 0;
  }

  /** 🔁 Khôi phục */
  async restore(id: string): Promise<boolean> {
    const res = await this.accountModel.updateOne(
      { _id: id },
      { $set: { is_delete: false } },
    );
    return res.modifiedCount > 0;
  }

  async findByRole(role: string): Promise<any[]> {
    return this.accountModel
      .find({ roles: { $in: [role] }, is_delete: false })
      .lean()
      .exec();
  }
}
