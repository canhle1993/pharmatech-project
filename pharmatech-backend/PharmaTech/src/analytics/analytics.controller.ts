import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Thẻ nhỏ: tổng sản phẩm, đơn hàng, doanh thu, job...
  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverviewCards();
  }

  // Line / Area chart: orders + revenue theo tháng
  @Get('orders/monthly')
  getOrdersMonthly(@Query('year') year?: string) {
    const y = year ? parseInt(year, 10) : undefined;
    return this.analyticsService.getOrdersMonthly(y);
  }

  // Bar / donut chart: orders theo status
  @Get('orders/status')
  getOrdersByStatus() {
    return this.analyticsService.getOrdersByStatus();
  }

  // Pie chart: product theo category
  @Get('products/by-category')
  getProductsByCategory() {
    return this.analyticsService.getProductsByCategory();
  }

  // Bar chart: số job (career) theo tháng
  @Get('careers/monthly')
  getCareersMonthly() {
    return this.analyticsService.getCareersMonthly();
  }
}
