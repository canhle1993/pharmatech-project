// src/career-analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CareerAnalytics,
  CareerAnalyticsDocument,
} from './analytics.decorator';
import { Application } from 'src/application/application.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(CareerAnalytics.name)
    private readonly analyticsModel: Model<CareerAnalyticsDocument>,
  ) {}

  /**
   * 🔁 Sync 1 bản ghi CareerAnalytics từ 1 Application + Account + Career
   * (Bạn đã gọi hàm này trong ApplicationService.create)
   */
  async syncApplicationAnalytics(app: any) {
    // app: application đã populate account_id & career_id
    const account = app.account_id || {};
    const career = app.career_id || {};

    // =======================================
    // 🔥 TÍNH TUỔI TỰ ĐỘNG TỪ DOB
    // =======================================
    let age: number | null = null;
    let age_range = 'Unknown';

    if (account.dob) {
      const dob = new Date(account.dob);
      const diff = Date.now() - dob.getTime();
      age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 18) age_range = '<18';
      else if (age <= 25) age_range = '18-25';
      else if (age <= 35) age_range = '26-35';
      else if (age <= 45) age_range = '36-45';
      else age_range = '>45';
    }

    // =======================================
    // 🔥 PAYLOAD LƯU VÀO career_analytics
    // =======================================
    const payload: Partial<CareerAnalytics> = {
      application_id: app._id,
      account_id: account._id,
      career_id: career._id,

      career_title: career.title,
      career_department: career.department,

      gender: account.gender,
      age,
      age_range,

      skills: account.skills || [],
      languages: account.languages || [],

      expected_salary: app.expected_salary,
      hired_start_date: app.hired_start_date || null,
      interview_date: app.interview_date || null,
      reviewed_date: app.reviewed_date || null,

      status: app.status,
      applied_date: app.created_at || app.applied_date || new Date(),
      result: app.result || null,

      updated_at: new Date(),
    };

    // =======================================
    // 🔄 UPSERT (update nếu có, thêm nếu chưa có)
    // =======================================
    await this.analyticsModel.updateOne(
      { application_id: app._id },
      { $set: payload },
      { upsert: true },
    );
  }

  // ===============================
  //  📊 1. Tổng quan dashboard
  // ===============================
  async getOverview() {
    const [
      totalApplications,
      totalCandidates,
      pending,
      interview,
      hired,
      rejected,
    ] = await Promise.all([
      this.analyticsModel.countDocuments({}),
      this.analyticsModel.distinct('account_id'),
      this.analyticsModel.countDocuments({ status: 'pending' }),
      this.analyticsModel.countDocuments({ status: 'interview' }),
      this.analyticsModel.countDocuments({
        $or: [{ status: 'accepted' }, { status: 'passed' }, { result: 'pass' }],
      }),
      this.analyticsModel.countDocuments({
        $or: [{ status: 'rejected' }, { result: 'fail' }],
      }),
    ]);

    return {
      totalApplications,
      totalCandidates: totalCandidates.length,
      pending,
      interview,
      hired,
      rejected,
    };
  }

  // ===============================
  //  📊 2. Thống kê theo status
  // ===============================
  async getStatusStats() {
    const rows = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows.map((r) => ({
      status: r._id || 'unknown',
      count: r.count,
    }));
  }

  // ===============================
  //  📊 3. Thống kê theo phòng ban
  // ===============================
  async getDepartmentStats() {
    const rows = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: '$career_department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows.map((r) => ({
      department: r._id || 'Others',
      count: r.count,
    }));
  }

  // ===============================
  //  📊 4. Thống kê theo khoảng tuổi
  // ===============================
  async getAgeRangeStats() {
    const rows = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: '$age_range',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows.map((r) => ({
      age_range: r._id || 'Unknown',
      count: r.count,
    }));
  }

  // ===============================
  //  📊 5. Số lượng apply theo ngày
  //     (line chart)
  // ===============================
  async getDailyApplications(from?: string, to?: string) {
    const match: any = {};
    if (from || to) {
      match.applied_date = {};
      if (from) match.applied_date.$gte = new Date(from);
      if (to) match.applied_date.$lte = new Date(to);
    }

    const pipeline: any[] = [];
    if (Object.keys(match).length) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$applied_date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    );

    const rows = await this.analyticsModel.aggregate(pipeline);

    return rows.map((r) => ({
      date: r._id,
      count: r.count,
    }));
  }

  // ===============================
  //  📊 6. Thống kê skills (TOP N)
  // ===============================
  async getSkillStats(limit = 10) {
    const rows = await this.analyticsModel.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return rows.map((r) => ({
      skill: r._id,
      count: r.count,
    }));
  }

  // ===============================
  //  📊 7. Funnel: pending → … → hired
  // ===============================
  async getFunnelStats() {
    const rows = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Đảm bảo thứ tự stage cố định cho FE
    const stages = [
      'pending',
      'reviewed',
      'assigned',
      'interview',
      'accepted',
      'passed',
      'rejected',
    ];

    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r._id || 'unknown', r.count));

    return stages.map((s) => ({
      stage: s,
      count: map.get(s) || 0,
    }));
  }
}
