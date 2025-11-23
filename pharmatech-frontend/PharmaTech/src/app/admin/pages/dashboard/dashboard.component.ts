import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartDirective } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

import {
  AnalyticsMainService,
  RevenueCategoryDate,
} from '../../../services/analytics-main.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HighchartsChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  chartOptions: Highcharts.Options = {};
  revenueData: RevenueCategoryDate[] = [];
  populationChart: any;

  constructor(private analyticsService: AnalyticsMainService) {}

  async ngOnInit() {
    await this.loadChartData();
    this.initPopulationChart();
  }

  async loadChartData() {
    this.revenueData = await this.analyticsService.getRevenueCategoryDate();
    this.buildChart();
  }

  async initPopulationChart() {
    // 🔥 TOP PRODUCTS 30 ngày
    const topProducts = await this.analyticsService.getTopProducts();
    console.log('🔥 Top products:', topProducts);

    // Format chart data
    const chartData = topProducts.map((p) => ({
      name: p.name,
      y: p.totalQuantity,
    }));

    // Tạo list 30 ngày gần nhất
    const days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    days.reverse();

    // Chart colors
    const colors = [
      '#4e79a7',
      '#f28e2b',
      '#e15759',
      '#76b7b2',
      '#59a14f',
      '#edc948',
      '#b07aa1',
      '#ff9da7',
      '#9c755f',
      '#bab0ab',
      '#5ab4ac',
      '#d8b365',
      '#8dd3c7',
      '#fb8072',
      '#80b1d3',
      '#fdb462',
      '#b3de69',
      '#fccde5',
      '#bc80bd',
      '#ccebc5',
    ];

    // Tạo chart
    this.populationChart = (Highcharts as any).chart('population-container', {
      chart: { type: 'bar', animation: true },
      title: { text: 'Top 10 best-selling products (last 30 days)' },
      xAxis: { type: 'category', title: { text: 'Product Name' } },
      yAxis: { title: { text: 'Quantity Sold' }, allowDecimals: false },
      legend: { enabled: false },
      plotOptions: {
        series: {
          borderWidth: 0,
          pointPadding: 0.05,
          groupPadding: 0,
          colorByPoint: true,
          dataLabels: { enabled: true, format: '{point.y}' },
        },
      },
      series: [
        {
          name: 'Quantity',
          data: chartData,
          type: 'bar',
        },
      ],
      colors: colors,
    });

    // ============================
    // 🎬 PLAY/PAUSE + HIỆN NGÀY
    // ============================
    const btn = document.getElementById(
      'play-pause-button'
    ) as HTMLButtonElement;
    const slider = document.getElementById('play-range') as HTMLInputElement;
    const dayLabel = document.getElementById('current-day') as HTMLElement;

    if (!btn || !slider || !dayLabel) return;

    // 🌟 Gán ngày hiện tại lúc load vào
    dayLabel.innerHTML = `Days: <b>${days[0]}</b>`;

    let timer: any = null;
    const maxDays = 29;

    // Khi kéo slider
    slider.addEventListener('input', () => {
      const idx = Number(slider.value);

      const data = chartData.slice(0, idx + 1);
      this.populationChart.series[0].setData(data);

      dayLabel.innerHTML = `Days: <b>${days[idx]}</b>`;
    });

    // Bấm Play/Pause
    btn.addEventListener('click', () => {
      if (btn.classList.contains('playing')) {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fa fa-play"></i>';
        clearInterval(timer);
        return;
      }

      btn.classList.add('playing');
      btn.innerHTML = '<i class="fa fa-pause"></i>';

      timer = setInterval(() => {
        let idx = Number(slider.value);

        if (idx >= maxDays) {
          clearInterval(timer);
          btn.classList.remove('playing');
          btn.innerHTML = '<i class="fa fa-play"></i>';
          return;
        }

        idx++;
        slider.value = idx.toString();

        const data = chartData.slice(0, idx + 1);
        this.populationChart.series[0].setData(data);

        // ⭐ Cập nhật ngày
        dayLabel.innerHTML = `Days: <b>${days[idx]}</b>`;
      }, 600);
    });
  }

  buildChart() {
    const dates = [...new Set(this.revenueData.map((d) => d.date))].sort();
    const categories = [...new Set(this.revenueData.map((d) => d.category))];

    const series = categories.map((cat) => ({
      name: cat,
      type: 'column' as const,
      stack: 'Revenue',
      data: dates.map((day) => {
        const f = this.revenueData.find(
          (x) => x.category === cat && x.date === day
        );
        return f ? f.totalRevenue : 0;
      }),
    }));

    this.chartOptions = {
      chart: { type: 'column' },
      title: { text: 'Revenue by Category (Daily)' },
      xAxis: { categories: dates },
      yAxis: {
        allowDecimals: false,
        min: 0,
        title: { text: 'Revenue ($)' },
      },
      tooltip: {
        formatter: function () {
          const p: any = this;
          return `
            <b>${p.key}</b><br/>
            ${p.series.name}: ${p.y}<br/>
            Total: ${p.point?.stackTotal ?? 0}
          `;
        },
      },
      plotOptions: { column: { stacking: 'normal' } },
      series: series as Highcharts.SeriesOptionsType[],
    };
  }
}
