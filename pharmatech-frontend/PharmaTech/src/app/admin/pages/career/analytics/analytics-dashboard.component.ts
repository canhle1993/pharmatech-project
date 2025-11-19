import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

import { ApplicationAnalyticsService } from '../../../../services/analytics.service';

@Component({
  standalone: true,
  imports: [CommonModule, ChartModule],
  selector: 'app-dashboard-analytics',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
})
export class DashboardAnalyticsComponent implements OnInit {
  loading = true;

  // RAW DATA
  overview: any = {};
  genderData: any = {};
  ageData: any = {};
  resultData: any = {};
  dailyAppData: any[] = [];
  skillsData: any[] = [];

  // PRIMENG CHART DATA
  dailyChart: any;
  genderChart: any;
  ageChart: any;
  skillsChart: any;
  resultChart: any;

  // OPTIONS
  lineOptions: any;
  barOptions: any;

  constructor(private analyticsService: ApplicationAnalyticsService) {}

  async ngOnInit() {
    await this.loadAllData();
    this.buildAllCharts();
  }

  // ==========================================================
  // 📌 LOAD DATA FROM API
  // ==========================================================
  async loadAllData() {
    try {
      // 1. OVERVIEW
      const ov = await this.analyticsService.getOverview();
      this.overview = {
        total: ov.totalApplications,
        pending: ov.pending,
        interview: ov.interview,
        pass: ov.hired,
        fail: ov.rejected,
      };

      // 2. STATUS (tạm dùng làm gender)
      const genderRes = await this.analyticsService.getStatusStats();
      this.genderData = genderRes.reduce((acc: any, x: any) => {
        acc[x.status] = x.count;
        return acc;
      }, {});

      // 3. AGE RANGE
      const ageRes = await this.analyticsService.getAgeRangeStats();
      this.ageData = ageRes.reduce((acc: any, x: any) => {
        acc[x.age_range] = x.count;
        return acc;
      }, {});

      // 4. DAILY APPLICATIONS
      this.dailyAppData = await this.analyticsService.getDailyApplications();

      // 5. TOP SKILLS
      this.skillsData = await this.analyticsService.getTopSkills(10);

      // 6. RESULT FUNNEL
      const funnel = await this.analyticsService.getResultStats();
      this.resultData = funnel.reduce((acc: any, x: any) => {
        acc[x.stage] = x.count;
        return acc;
      }, {});
    } catch (err) {
      console.error('Analytics Load Error:', err);
    }

    this.loading = false;
  }

  // ==========================================================
  // 📌 BUILD ALL PRIMENG CHARTS
  // ==========================================================
  buildAllCharts() {
    this.buildDailyChart();
    this.buildGenderChart();
    this.buildAgeChart();
    this.buildSkillsChart();
    this.buildResultChart();
  }

  // ----------------------------------------------------------
  // 📍 DAILY APPLICATIONS (LINE)
  // ----------------------------------------------------------
  buildDailyChart() {
    this.dailyChart = {
      labels: this.dailyAppData.map((d: any) => d.date),
      datasets: [
        {
          label: 'Applications',
          data: this.dailyAppData.map((d: any) => d.count),
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66,165,245,0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
    };
  }

  // ----------------------------------------------------------
  // 📍 GENDER (PIE)
  // ----------------------------------------------------------
  buildGenderChart() {
    this.genderChart = {
      labels: Object.keys(this.genderData),
      datasets: [
        {
          data: Object.values(this.genderData),
          backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A', '#AB47BC'],
        },
      ],
    };
  }

  // ----------------------------------------------------------
  // 📍 AGE RANGE (DOUGHNUT)
  // ----------------------------------------------------------
  buildAgeChart() {
    this.ageChart = {
      labels: Object.keys(this.ageData),
      datasets: [
        {
          data: Object.values(this.ageData),
          backgroundColor: ['#42A5F5', '#7E57C2', '#26A69A', '#EF5350'],
        },
      ],
    };
  }

  // ----------------------------------------------------------
  // 📍 TOP SKILLS (HORIZONTAL BAR)
  // ----------------------------------------------------------
  buildSkillsChart() {
    this.skillsChart = {
      labels: this.skillsData.map((x: any) => x.skill),
      datasets: [
        {
          label: 'Count',
          data: this.skillsData.map((x: any) => x.count),
          backgroundColor: '#66BB6A',
        },
      ],
    };

    this.barOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
    };
  }

  // ----------------------------------------------------------
  // 📍 APPLICATION RESULTS (POLAR AREA)
  // ----------------------------------------------------------
  buildResultChart() {
    this.resultChart = {
      labels: Object.keys(this.resultData),
      datasets: [
        {
          data: Object.values(this.resultData),
          backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A', '#EF5350'],
        },
      ],
    };
  }
}
