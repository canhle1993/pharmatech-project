// src/career-analytics/analytics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/career-analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** 📌 Tổng quan dashboard */
  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  /** 📌 Số lượng đơn theo status */
  @Get('by-status')
  getByStatus() {
    return this.analyticsService.getStatusStats();
  }

  /** 📌 Số lượng đơn theo phòng ban */
  @Get('by-department')
  getByDepartment() {
    return this.analyticsService.getDepartmentStats();
  }

  /** 📌 Số lượng theo khoảng tuổi */
  @Get('by-age-range')
  getByAgeRange() {
    return this.analyticsService.getAgeRangeStats();
  }

  /** 📌 Line chart: apply theo ngày (có thể filter from/to) */
  @Get('daily-applications')
  getDailyApplications(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getDailyApplications(from, to);
  }

  /** 📌 Top skills */
  @Get('top-skills')
  getTopSkills(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) || 10 : 10;
    return this.analyticsService.getSkillStats(n);
  }

  /** 📌 Funnel: pending → interviewed → hired / rejected */
  @Get('funnel')
  getFunnel() {
    return this.analyticsService.getFunnelStats();
  }
}
