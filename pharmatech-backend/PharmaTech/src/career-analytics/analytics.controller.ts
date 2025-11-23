// src/career-analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/role.decorator';

@Controller('api/career-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** 📌 Tổng quan dashboard */
  @Get('overview')
  @Roles('superadmin', 'admin')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  /** 📌 Số lượng đơn theo status */
  @Get('by-status')
  @Roles('superadmin', 'admin')
  getByStatus() {
    return this.analyticsService.getStatusStats();
  }

  /** 📌 Số lượng đơn theo phòng ban */
  @Get('by-department')
  @Roles('superadmin', 'admin')
  getByDepartment() {
    return this.analyticsService.getDepartmentStats();
  }

  /** 📌 Số lượng theo khoảng tuổi */
  @Get('by-age-range')
  @Roles('superadmin', 'admin')
  getByAgeRange() {
    return this.analyticsService.getAgeRangeStats();
  }

  /** 📌 Line chart: apply theo ngày (có thể filter from/to) */
  @Get('daily-applications')
  @Roles('superadmin', 'admin')
  getDailyApplications(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getDailyApplications(from, to);
  }

  /** 📌 Top skills */
  @Get('top-skills')
  @Roles('superadmin', 'admin')
  getTopSkills(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) || 10 : 10;
    return this.analyticsService.getSkillStats(n);
  }

  /** 📌 Funnel: pending → interviewed → hired / rejected */
  @Get('funnel')
  @Roles('superadmin', 'admin')
  getFunnel() {
    return this.analyticsService.getFunnelStats();
  }
}
