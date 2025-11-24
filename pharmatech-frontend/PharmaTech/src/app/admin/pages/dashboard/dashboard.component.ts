import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HighchartsChartDirective,
  providePartialHighcharts,
} from 'highcharts-angular';
import * as Highcharts from 'highcharts';

import {
  AnalyticsMainService,
  RevenueCategoryDate,
} from '../../../services/analytics-main.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HighchartsChartDirective],
  providers: [
    providePartialHighcharts({
      modules: () => [import('highcharts/esm/modules/variable-pie')],
    }),
  ],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  chartOptions: Highcharts.Options = {};
  revenueData: RevenueCategoryDate[] = [];
  populationChart: any;

  public Highcharts: typeof Highcharts = Highcharts;
  pieChartOptions: Highcharts.Options = {};

  constructor(private analyticsService: AnalyticsMainService) {}

  async ngOnInit() {
    await this.loadChartData();
    this.initPopulationChart();
    this.initPieChart();
  }

  async loadChartData() {
    this.revenueData = await this.analyticsService.getRevenueCategoryDate();
    this.buildChart();
  }

  async initPieChart() {
    // 🔥 1) Gọi API BE để lấy số lượng sản phẩm theo category
    const stats = await this.analyticsService.getProductsByCategory();

    // Nếu API lỗi hoặc rỗng thì không làm gì
    if (!stats || stats.length === 0) {
      console.warn('⚠️ No category statistics found.');
      return;
    }

    // 🔄 2) Convert dữ liệu BE sang format Highcharts cần
    const chartData = stats.map((c: any) => ({
      name: c.category_name, // vd: Capsules, Liquids
      y: c.totalProducts, // tổng số sản phẩm
    }));

    // 🎯 3) Giữ nguyên toàn bộ giao diện chart, CHỈ THAY DATA
    this.pieChartOptions = {
      chart: { type: 'pie' },
      title: { text: 'Sales Distribution by Category' },
      tooltip: {
        pointFormat: '<b>{point.y} products</b>',
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%',
          },
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Sales',
          data: chartData, // ⭐ Gắn data từ database vào đây
        },
      ],
    };
  }

  async initPopulationChart() {
    const topProducts = await this.analyticsService.getTopProducts();

    const chartData = topProducts.map((p) => ({
      name: p.name,
      y: p.totalQuantity,
    }));

    // ============================
    // ⭐ TẠO 30 NGÀY GẦN NHẤT
    // ============================
    const days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    // 🔄 Đảo lại cho đúng thứ tự cũ → mới
    days.reverse();

    // ============================
    // ⭐ SORT DỮ LIỆU BAR
    // ============================
    chartData.sort((a, b) => b.y - a.y);

    const emptyBars = chartData.map((p) => ({
      name: p.name,
      y: p.y,
    }));

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
    ];

    // ============================
    // 📊 BUILD CHART
    // ============================
    this.populationChart = (Highcharts as any).chart('population-container', {
      chart: { type: 'bar', animation: false },
      title: { text: 'Top 10 best-selling products (last 30 days)' },
      colors: colors,
      xAxis: { type: 'category' },
      yAxis: { allowDecimals: false, title: null },
      legend: { enabled: false },

      plotOptions: {
        series: {
          colorByPoint: true,
          animation: false,
          borderWidth: 0,
          groupPadding: 0,
          pointPadding: 0.05,
          dataSorting: { enabled: true, matchByName: true },
          dataLabels: { enabled: true, format: '{point.y}' },
        },
      },

      series: [
        {
          type: 'bar',
          name: 'Quantity',
          data: emptyBars,
        },
      ],
    });

    // ============================
    // 🔘 UI ELEMENTS
    // ============================
    const btn = document.getElementById(
      'play-pause-button'
    ) as HTMLButtonElement;
    const slider = document.getElementById('play-range') as HTMLInputElement;
    const dayLabel = document.getElementById('current-day') as HTMLElement;

    if (!btn || !slider || !dayLabel) return;

    slider.min = '0';
    slider.max = (chartData.length - 1).toString();
    slider.value = '0';

    // ⭐ LÚC MỚI VÀO: HIỆN NGÀY HÔM NAY
    // dayLabel.innerHTML = `Days: <b>${days[0]}</b>`;
    dayLabel.innerHTML = '';
    const maxDays = 29;
    let timer: any = null;

    // ============================
    // ⭐ ONE FRAME UPDATE
    // ============================
    const updateFrame = (idx: number) => {
      const series = this.populationChart.series[0];

      series.points[idx].update({ y: chartData[idx].y }, false);
      this.populationChart.redraw(true);

      // ⭐ HIỆN NGÀY ĐÚNG
      // dayLabel.innerHTML = `Days: <b>${days[idx]}</b>`;
    };

    // ============================
    // ⏳ SLIDER MANUAL
    // ============================
    slider.addEventListener('input', () => {
      const idx = Number(slider.value);

      // Reset toàn bộ về 0
      this.populationChart.series[0].points.forEach((pt) =>
        pt.update({ y: 0 }, false)
      );

      // Update từ 0 → idx
      for (let i = 0; i <= idx; i++) {
        this.populationChart.series[0].points[i].update(
          { y: chartData[i].y },
          false
        );
      }

      this.populationChart.redraw(true);

      // ⭐ HIỆN NGÀY ĐÚNG
      // dayLabel.innerHTML = `Day: <b>${days[idx]}</b>`;
    });

    // ============================
    // 🎬 PLAY / PAUSE
    // ============================
    btn.addEventListener('click', () => {
      if (btn.classList.contains('playing')) {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fa fa-play"></i>';
        clearInterval(timer);
        return;
      }

      btn.classList.add('playing');
      btn.innerHTML = '<i class="fa fa-pause"></i>';

      // Reset chart
      this.populationChart.series[0].points.forEach((pt) =>
        pt.update({ y: 0 }, false)
      );
      this.populationChart.redraw(true);

      let idx = 0;
      slider.value = '0';

      timer = setInterval(() => {
        if (idx >= chartData.length) {
          clearInterval(timer);
          btn.classList.remove('playing');
          btn.innerHTML = '<i class="fa fa-play"></i>';
          return;
        }

        slider.value = idx.toString();
        updateFrame(idx);
        idx++;
        // dayLabel.innerHTML = `Days: <b>${days[idx]}</b>`;
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
