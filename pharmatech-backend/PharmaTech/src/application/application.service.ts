// src/application/application.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application } from './application.decorator';
import { ApplicationDTO, CreateApplicationDto } from './application.dto';
import { plainToInstance } from 'class-transformer';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private readonly appModel: Model<Application>,
    private readonly mailService: MailService,
  ) {}

  /** 🟢 Tạo mới 1 đơn ứng tuyển */
  async create(data: CreateApplicationDto): Promise<ApplicationDTO> {
    const created = await this.appModel.create({
      ...data,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    return plainToInstance(ApplicationDTO, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Lấy tất cả đơn ứng tuyển */
  async findAll(): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find()
      .sort({ created_at: -1 })
      .populate(
        'account_id',
        'name email photo field skills preferred_area job_type expected_salary available_from',
      )
      .populate('career_id', 'title location')
      .lean();

    const formatted = apps.map((app) => ({
      ...app,
      account: app.account_id,
      career: app.career_id,
    }));

    return plainToInstance(ApplicationDTO, formatted, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Lấy danh sách đơn theo account */
  async findByAccount(account_id: string): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find({ account_id })
      .sort({ created_at: -1 })
      .lean();

    return plainToInstance(ApplicationDTO, apps, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Lấy danh sách đơn theo career */
  async findByCareer(career_id: string): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find({ career_id })
      .sort({ created_at: -1 })
      .lean();

    return plainToInstance(ApplicationDTO, apps, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Cập nhật trạng thái */
  async updateStatus(
    id: string,
    status: string,
    note?: string,
  ): Promise<ApplicationDTO> {
    const app = await this.appModel.findById(id);
    if (!app) throw new NotFoundException('Application not found');

    app.status = status;
    app.updated_at = new Date();
    if (note) app.note = note;

    await app.save();

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟣 Phân công Admin (SuperAdmin chỉ đạo) */
  async assignAdmin(
    id: string,
    admin_id: string,
    admin_name: string,
  ): Promise<ApplicationDTO> {
    const app = await this.appModel.findById(id);
    if (!app) throw new NotFoundException('Application not found');

    // 🟢 Cập nhật thông tin
    app.assigned_admin_id = admin_id;
    app.assigned_admin_name = admin_name;
    app.assigned_at = new Date();
    app.status = 'assigned';

    await app.save();

    // 🧠 Sau khi lưu, load lại với populate để FE có đủ dữ liệu
    const populatedApp = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    // ✅ Trả về DTO đầy đủ
    return plainToInstance(ApplicationDTO, populatedApp, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟣 Lên lịch phỏng vấn (Admin thao tác) */

  async scheduleInterview(
    id: string,
    data: {
      date: Date; // FE gửi lên (có thể là string, NestJS vẫn nhận)
      location: string;
    },
  ): Promise<ApplicationDTO> {
    // 🔍 lấy lại application kèm account + career để có name/email/title
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .exec();

    if (!app) throw new NotFoundException('Application not found');

    if (!data.date || !data.location) {
      throw new BadRequestException('Missing interview date or location');
    }

    // 🕒 format thời gian cho đẹp (dùng moment luôn cho đồng bộ)
    const moment = require('moment');
    const dateStr = moment(data.date).format('DD/MM/YYYY HH:mm');

    const candidateName = app.account_id['name'] || 'Candidate';
    const candidateEmail = app.account_id['email'];
    const jobTitle = app.career_id['title'] || 'your applied position';

    // 📝 TỰ ĐỘNG SINH EMAIL CONTENT (HTML)
    const emailHtml = `
    <p>Dear <b>${candidateName}</b>,</p>

    <p>Thank you for applying for the position <b>${jobTitle}</b> at our company.</p>

    <p>After reviewing your application, we would like to invite you to an interview:</p>

    <ul>
      <li><b>Position</b>: ${jobTitle}</li>
      <li><b>Interview time</b>: ${dateStr}</li>
      <li><b>Location / Meeting link</b>: ${data.location}</li>
    </ul>

    <p>If you need to reschedule or have any questions, please reply to this email.</p>

    <p>Best regards,<br/>
    PharmaTech HR Team</p>
  `;

    // 💾 Lưu dữ liệu phỏng vấn vào DB
    app.interview_date = data.date;
    app.interview_location = data.location;
    (app as any).interview_email_content = emailHtml; // field mới
    app.status = 'interview';
    app.email_sent = false;
    app.updated_at = new Date();

    await app.save();

    // 📧 Gửi email mời phỏng vấn
    await this.mailService.send2(
      'aplevancanh1993@gmail.com', // from
      candidateEmail, // to
      `Interview Invitation – ${jobTitle}`, // subject
      emailHtml, // body (HTML)
    );

    // ✅ Đánh dấu đã gửi email
    app.email_sent = true;
    await app.save();

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟣 Cập nhật kết quả phỏng vấn (Admin thao tác) */
  async updateResult(
    id: string,
    data: {
      result: string;
      hired_start_date?: Date;
      hired_department?: string;
    },
  ): Promise<ApplicationDTO> {
    const app = await this.appModel.findById(id);
    if (!app) throw new NotFoundException('Application not found');

    app.result = data.result;
    app.hired_start_date = data.hired_start_date;
    app.hired_department = data.hired_department;
    app.status = data.result === 'pass' ? 'hired' : 'rejected';
    app.updated_at = new Date();

    await app.save();

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Xóa hồ sơ */
  async delete(id: string): Promise<boolean> {
    const result = await this.appModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
