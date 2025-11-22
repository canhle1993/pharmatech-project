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
import { getImageUrl } from 'src/account/config.util';
import { AnalyticsService } from 'src/career-analytics/analytics.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private readonly appModel: Model<Application>,
    private readonly mailService: MailService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /** 🟢 Tạo mới 1 đơn ứng tuyển */
  async create(data: CreateApplicationDto): Promise<ApplicationDTO> {
    const created = await this.appModel.create({
      ...data,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    /* ⭐ GỌI SYNC */
    const populated = await this.appModel
      .findById(created._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

    return plainToInstance(ApplicationDTO, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Lấy tất cả đơn ứng tuyển */
  /** 🟢 Lấy tất cả đơn ứng tuyển */
  async findAll(): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .populate('account_id') // ⭐ LẤY FULL ACCOUNT
      .populate('career_id', 'title location')
      .lean();

    const formatted = apps.map((app) => {
      return {
        ...app,

        // ⭐ Trả về account đúng format
        account: {
          ...app.account_id,
          resume: app.account_id?.resume
            ? `${getImageUrl()}${app.account_id.resume}`
            : null,
        },

        // ⭐ Trả về career
        career: app.career_id,
      };
    });

    return plainToInstance(ApplicationDTO, formatted, {
      excludeExtraneousValues: true,
    });
  }

  async findHistory(): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find({ is_active: false }) // ⭐ chỉ lấy đã xoá / expired
      .sort({ updated_at: -1 })
      .populate('account_id')
      .populate('career_id', 'title location')
      .lean();

    return plainToInstance(ApplicationDTO, apps, {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Lấy danh sách đơn theo account */
  /** 🟢 Lấy danh sách đơn theo account */
  async findByAccount(account_id: string): Promise<ApplicationDTO[]> {
    const apps = await this.appModel
      .find({ account_id })
      .sort({ created_at: -1 })
      .populate('career_id', 'title location department banner') // ⭐ có banner
      .lean();

    const formatted = apps.map((app: any) => {
      // build full banner URL
      let banner: string | null = null;

      if (app.career_id?.banner) {
        const raw = app.career_id.banner as string;

        if (raw.startsWith('http')) {
          banner = raw; // đã full URL rồi thì giữ nguyên
        } else {
          // http://localhost:3000/upload/career-banners/xxx.jpg
          banner = `${getImageUrl()}/career-banners/${raw}`;
        }
      }

      return {
        ...app,
        // ⭐ Thêm field career cho FE
        career: {
          id: app.career_id?._id?.toString(),
          title: app.career_id?.title,
          department: app.career_id?.department,
          location: app.career_id?.location,
          banner,
        },
      };
    });

    return plainToInstance(ApplicationDTO, formatted, {
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

    /* ⭐ GỌI SYNC */
    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

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

    /* ⭐ GỌI SYNC */
    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

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
      date: Date;
      location: string;
      email_content: string; // FE gửi nội dung email sau khi admin chỉnh sửa
    },
  ): Promise<ApplicationDTO> {
    // load lại application cùng account & career
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .exec();

    if (!app) throw new NotFoundException('Application not found');

    if (!data.date || !data.location || !data.email_content) {
      throw new BadRequestException('Missing required fields');
    }

    // lưu schedule vào DB
    app.interview_date = data.date;
    app.interview_location = data.location;
    (app as any).interview_email_content = data.email_content;
    app.status = 'interview';
    app.email_sent = false;
    app.updated_at = new Date();

    await app.save();

    /* ⭐ GỌI SYNC */
    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

    // gửi email theo nội dung FE truyền lên
    await this.mailService.send2(
      'aplevancanh1993@gmail.com',
      app.account_id['email'],
      `Interview Invitation – ${app.career_id['title']}`,
      data.email_content,
    );

    // đánh dấu đã gửi
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

    /* ⭐ GỌI SYNC */
    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟢 Xóa hồ sơ */
  async delete(id: string): Promise<boolean> {
    const result = await this.appModel.updateOne(
      { _id: id },
      {
        is_active: false,
        updated_at: new Date(),
      },
    );
    return result.modifiedCount > 0;
  }

  async restore(id: string): Promise<boolean> {
    const result = await this.appModel.updateOne(
      { _id: id },
      {
        is_active: true,
        updated_at: new Date(),
      },
    );
    return result.modifiedCount > 0;
  }

  async deletePermanent(id: string): Promise<boolean> {
    const result = await this.appModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async generateEmailTemplate(id: string): Promise<string> {
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .lean();

    if (!app) throw new NotFoundException('Application not found');

    const candidateName = app.account_id?.name || 'Candidate';
    const jobTitle = app.career_id?.title || 'your applied position';

    const template = `
    <p>Dear <b>{{candidate_name}}</b>,</p>

    <p>Thank you for applying for the position <b>{{job_title}}</b>.</p>

    <p>We would like to invite you to an interview.</p>

    <p><b>Time:</b> {{interview_time}}</p>
    <p><b>Location:</b> {{interview_location}}</p>

    <p>Best regards,<br/>PharmaTech HR Team</p>
  `;

    return template;
  }

  /** 🟢 Generate PASS email template */
  async generatePassTemplate(id: string): Promise<string> {
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .lean();

    if (!app) throw new NotFoundException('Application not found');

    const candidateName = app.account_id?.name || 'Candidate';
    const jobTitle = app.career_id?.title || 'the applied position';

    const template = `
    <p>Dear <b>{{candidate_name}}</b>,</p>

    <p>Congratulations! You have successfully passed the interview for the position
    <b>{{job_title}}</b>.</p>

    <p>We are pleased to offer you this job at PharmaTech.</p>

    <p><b>Start Working Date:</b> {{start_work_date}}</p>
    <p><b>Work Location:</b> {{location}}</p>

    <p>Welcome to our team!</p>

    <p>Best regards,<br/>PharmaTech HR Team</p>
  `;

    return template;
  }

  /** 🟥 Generate REJECT email template */
  async generateRejectTemplate(id: string): Promise<string> {
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .lean();

    if (!app) throw new NotFoundException('Application not found');

    const candidateName = app.account_id?.name || 'Candidate';
    const jobTitle = app.career_id?.title || 'the applied position';

    const template = `
    <p>Dear <b>{{candidate_name}}</b>,</p>

    <p>Thank you for your interest in the <b>{{job_title}}</b> position at PharmaTech.</p>

    <p>After careful consideration, we regret to inform you that we will not be moving forward 
    with your application at this time.</p>

    <p>We sincerely appreciate the time you invested and encourage you to apply again for future opportunities.</p>

    <p>Best regards,<br/>PharmaTech HR Team</p>
  `;

    return template;
  }

  /** 🟩 Mark as PASS */
  async markAsPass(
    id: string,
    data: {
      start_work_date: Date;
      location?: string;
      email_content: string;
    },
  ): Promise<ApplicationDTO> {
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .exec();

    if (!app) throw new NotFoundException('Application not found');

    if (!data.start_work_date) {
      throw new BadRequestException('Start working date is required');
    }

    if (!data.email_content?.trim()) {
      throw new BadRequestException('Email content is empty');
    }

    // SAVE DB
    app.pass_date = new Date();
    app.start_work_date = data.start_work_date;
    app.pass_location = data.location || null;
    app.pass_email_content = data.email_content.trim();

    app.status = 'passed';
    app.email_sent = false;
    app.updated_at = new Date();

    await app.save();

    // SEND EMAIL
    await this.mailService.send2(
      'aplevancanh1993@gmail.com',
      app.account_id['email'],
      `Congratulations – Offer for ${app.career_id['title']}`,
      data.email_content.trim(),
    );

    app.email_sent = true;
    await app.save();

    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🟥 Mark as REJECT */
  async markAsReject(
    id: string,
    data: {
      reason?: string;
      email_content: string;
      rejected_by?: string;
    },
  ): Promise<ApplicationDTO> {
    const app = await this.appModel
      .findById(id)
      .populate('account_id', 'name email')
      .populate('career_id', 'title')
      .exec();

    if (!app) throw new NotFoundException('Application not found');

    if (!data.email_content?.trim()) {
      throw new BadRequestException('Reject email content is empty');
    }

    // SAVE DB
    app.reject_date = new Date();
    app.reject_reason = data.reason || null;
    app.reject_email_content = data.email_content.trim();
    app.rejected_by = data.rejected_by || null;

    app.status = 'rejected';
    app.email_sent = false;
    app.updated_at = new Date();

    await app.save();
    const populated = await this.appModel
      .findById(app._id)
      .populate('account_id')
      .populate('career_id')
      .lean();

    await this.analyticsService.syncApplicationAnalytics(populated);

    // SEND EMAIL
    await this.mailService.send2(
      'aplevancanh1993@gmail.com',
      app.account_id['email'],
      `Interview Result – ${app.career_id['title']}`,
      data.email_content.trim(),
    );

    app.email_sent = true;
    await app.save();

    return plainToInstance(ApplicationDTO, app.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** 🔍 CHECK — user đã apply job này chưa */
  async checkDuplicate(
    account_id: string,
    career_id: string,
  ): Promise<boolean> {
    const exists = await this.appModel.findOne({
      account_id,
      career_id,
      is_active: true, // chỉ check ứng tuyển còn hoạt động
    });

    return !!exists; // true = đã apply
  }
}
