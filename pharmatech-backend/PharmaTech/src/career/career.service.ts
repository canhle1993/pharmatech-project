import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCareerDto, UpdateCareerDto, CareerDTO } from './career.dto';
import { plainToInstance } from 'class-transformer';
import { MailService } from 'src/mail/mail.service';
import { Account } from 'src/account/account.decorator';
import { ConfigService } from '@nestjs/config';
import { getFrontendUrl } from 'src/account/config.util';

@Injectable()
export class CareerService {
  constructor(
    @InjectModel('Career') private readonly careerModel: Model<any>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /** 🆕 Tạo bài tuyển dụng mới + Gửi email đến user phù hợp */
  async create(careerData: CreateCareerDto): Promise<CareerDTO> {
    const now = new Date();
    const posted = careerData.posted_date
      ? new Date(careerData.posted_date)
      : now;

    const doc = new this.careerModel({
      ...careerData,
      posted_date: posted,
      created_at: now,
      updated_at: now,
      is_active: true,
    });

    const saved = await doc.save();

    // ✅ Gửi email cho các user có hồ sơ phù hợp
    await this.notifyUsersWithMatchingProfile(saved);

    return plainToInstance(CareerDTO, saved.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 📬 Gửi mail cho user có field / skills / area liên quan */
  private async notifyUsersWithMatchingProfile(career: any): Promise<void> {
    try {
      const query = {
        is_delete: false,
        is_active: true,
        $or: [
          { field: { $in: career.field || [] } },
          { skills: { $in: career.skills || [] } },
          { preferred_area: career.area },
          { languages: { $in: career.language || [] } },
        ],
      };

      const users = await this.accountModel.find(query).lean();
      if (!users.length) return;

      const subject = `New Job Opportunity: ${career.title}`;
      const baseUrl = getFrontendUrl();
      const link = `${baseUrl}/careerDetails/${career._id}`;
      const content = `
        <h3>Hi there!</h3>
        <p>We found a new job opportunity that matches your profile:</p>
        <ul>
          <li><strong>Title:</strong> ${career.title}</li>
          <li><strong>Department:</strong> ${career.department}</li>
          <li><strong>Location:</strong> ${career.location}</li>
          <li><strong>Work type:</strong> ${career.work_type || 'N/A'}</li>
        </ul>
        <p><a href="${link}" target="_blank">👉 View Job Details</a></p>
        <hr/>
        <p>Thank you for using PharmaTech Careers.</p>
      `;

      for (const u of users) {
        if (!u.email) continue;
        await this.mailService.send2(
          this.configService.get('mail_username'),
          u.email,
          subject,
          content,
        );
      }

      console.log(`📩 Sent job notification to ${users.length} users.`);
    } catch (err) {
      console.error('❌ Failed to send job notifications:', err.message);
    }
  }

  /** 📋 Lấy danh sách job */
  async findAll(): Promise<CareerDTO[]> {
    const careers = await this.careerModel
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .lean();

    return plainToInstance(CareerDTO, careers, {
      excludeExtraneousValues: true,
    });
  }

  /** 🔍 Lấy job theo ID */
  async findById(id: string): Promise<CareerDTO> {
    const job = await this.careerModel.findById(id).lean();
    if (!job) throw new NotFoundException('Career not found');

    return plainToInstance(CareerDTO, job, {
      excludeExtraneousValues: true,
    });
  }

  /** ✏️ Cập nhật bài đăng */
  async update(id: string, updateData: UpdateCareerDto): Promise<CareerDTO> {
    const existing = await this.careerModel.findById(id).lean();
    if (!existing) throw new NotFoundException('Career not found');

    const updated = await this.careerModel.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true },
    );

    return plainToInstance(CareerDTO, updated.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🗑️ Xóa mềm bài đăng */
  async delete(id: string): Promise<boolean> {
    const result = await this.careerModel.updateOne(
      { _id: id },
      { $set: { is_active: false, updated_at: new Date() } },
    );
    return result.modifiedCount > 0;
  }

  /** 🧭 Gợi ý các job tương tự */
  async findSimilarById(id: string): Promise<CareerDTO[]> {
    if (!id || id === 'undefined') {
      return []; // hoặc throw new BadRequestException('Invalid career id');
    }

    const current = (await this.careerModel.findById(id).lean()) as any;
    if (!current) throw new NotFoundException('Career not found');

    const query = {
      _id: { $ne: id },
      is_active: true,
      $or: [
        { field: { $in: current.field || [] } },
        { industry: { $in: current.industry || [] } },
        { area: current.area },
      ],
    };

    const results = await this.careerModel
      .find(query)
      .limit(5)
      .sort({ created_at: -1 })
      .lean();

    return plainToInstance(CareerDTO, results, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟡 Lấy danh sách job đã bị tắt (History) */
  async findHistory(): Promise<CareerDTO[]> {
    const careers = await this.careerModel
      .find({ is_active: false })
      .sort({ updated_at: -1 })
      .lean();

    return plainToInstance(CareerDTO, careers, {
      excludeExtraneousValues: true,
    });
  }

  /** ♻️ Khôi phục job */
  async restore(id: string): Promise<CareerDTO> {
    const career = await this.careerModel.findById(id);
    if (!career) throw new NotFoundException('Career not found');

    career.is_active = true;
    career.updated_at = new Date();

    const updated = await career.save();

    return plainToInstance(CareerDTO, updated.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🔥 Xóa vĩnh viễn (không thể phục hồi) */
  async deletePermanent(id: string): Promise<boolean> {
    const result = await this.careerModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /** ⏳ Auto chuyển bài hết hạn sang lịch sử */
  async autoExpire() {
    await this.careerModel.updateMany(
      {
        expiration_date: { $lte: new Date() },
        is_active: true,
      },
      {
        $set: { is_active: false, updated_at: new Date() },
      },
    );
  }
}
