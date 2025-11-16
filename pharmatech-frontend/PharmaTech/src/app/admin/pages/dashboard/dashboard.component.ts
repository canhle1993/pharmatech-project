import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../services/analytics.service';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  PieController,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// ⭐ MUST REGISTER CHART COMPONENTS
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  PieController,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, NgChartsModule],
})
export class DashboardComponent implements OnInit {
  overview: any[] = [];

  revenueData: any;
  orderStatusData: any;
  productCategoryData: any;
  careerDeptData: any;

  chartOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
  };

  constructor(private analytics: AnalyticsService) {}

  ngOnInit(): void {
    console.log('🏁 Dashboard init');

    this.loadOverview();
    this.loadRevenue();
    this.loadOrderStatus();
    this.loadProductsByCategory();
    this.loadCareerByDepartment();
  }

  loadOverview() {
    this.analytics.getOverviewCards().subscribe((res) => {
      console.log('📌 Overview API =>', res);

      this.overview = [
        { title: 'Products', value: res.totalProducts },
        { title: 'Categories', value: res.totalCategories },
        { title: 'Orders', value: res.totalOrders },
        { title: 'Careers', value: res.totalCareers },
      ];
    });
  }

  loadRevenue() {
    this.analytics.getRevenueMonthly().subscribe((data) => {
      this.revenueData = {
        labels: data.map((x: any) => `Month ${x.month}`),
        datasets: [
          {
            label: 'Revenue (USD)',
            data: data.map((x: any) => x.totalRevenue),
            borderColor: '#4b7bec',
            fill: false,
          },
        ],
      };
    });
  }

  loadOrderStatus() {
    this.analytics.getOrdersByStatus().subscribe((data) => {
      this.orderStatusData = {
        labels: data.map((x: any) => x.status),
        datasets: [
          {
            data: data.map((x: any) => x.count),
            backgroundColor: ['#4cd137', '#e84118', '#00a8ff', '#9c88ff'],
          },
        ],
      };
    });
  }

  loadProductsByCategory() {
    this.analytics.getProductsByCategory().subscribe((data) => {
      this.productCategoryData = {
        labels: data.map((x: any) => x.category_name),
        datasets: [
          {
            label: 'Products',
            data: data.map((x: any) => x.productCount),
            backgroundColor: '#00a8ff',
          },
        ],
      };
    });
  }

  loadCareerByDepartment() {
    this.analytics.getCareerByDepartment().subscribe((data) => {
      const filtered = data.filter((d) => d.count > 0);

      this.careerDeptData = {
        labels: filtered.map((d) => `Month ${d.month}`),
        datasets: [
          {
            label: 'Career Posts',
            data: filtered.map((d) => d.count),
            backgroundColor: [
              '#fbc531',
              '#e1b12c',
              '#487eb0',
              '#e84118',
              '#4cd137',
              '#0097e6',
              '#8c7ae6',
              '#eccc68',
              '#ff6b81',
              '#7bed9f',
              '#70a1ff',
              '#5352ed',
            ],
          },
        ],
      };
    });
  }
}
