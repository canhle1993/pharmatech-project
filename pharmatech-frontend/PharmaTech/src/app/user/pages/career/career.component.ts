import { Component, OnInit, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

declare var Swiper: any;

@Component({
  standalone: true,
  selector: 'app-user-career',
  templateUrl: './career.component.html',
  styleUrls: ['./career.component.css'],
  imports: [CommonModule, RouterLink],
})
export class CareerComponent implements OnInit, AfterViewInit {
  careers: Career[] = [];
  filteredCareers: Career[] = [];
  fields: { name: string; total: number }[] = [];
  selectedField: string | null = null;
  loading = true;

  constructor(
    private renderer: Renderer2,
    private careerService: CareerService
  ) {}

  async ngOnInit() {
    await this.loadCareers();
  }

  /** 🔹 Load tất cả career từ BE */
  async loadCareers() {
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];

      /** ================================
       *  🎯 Sort: Active trước – Expired/Inactive sau
       *  ================================ */
      this.careers.sort((a, b) => {
        const aIsExpired = this.isExpired(a) ? 1 : 0;
        const bIsExpired = this.isExpired(b) ? 1 : 0;
        return aIsExpired - bIsExpired; // expired = 1 → xuống cuối
      });

      /** 📌 Gom nhóm Field */
      const map: Record<string, number> = {};
      this.careers.forEach((job) => {
        (job.field || []).forEach((f) => {
          map[f] = (map[f] || 0) + 1;
        });
      });

      this.fields = Object.keys(map).map((name) => ({
        name,
        total: map[name],
      }));

      this.filteredCareers = [...this.careers];
    } catch (err) {
      console.error('❌ Lỗi load career:', err);
    } finally {
      this.loading = false;
      setTimeout(() => this.initSwiper(), 200);
    }
  }

  /** 🔍 Lọc theo field */
  filterByField(field: string | null) {
    this.selectedField = field;
    this.filteredCareers = field
      ? this.careers.filter((job) => (job.field || []).includes(field))
      : [...this.careers];
  }

  /** 🧭 Swiper */
  private initSwiper() {
    new Swiper('.field-swiper', {
      modules: [Navigation],
      slidesPerView: 5,
      spaceBetween: 25,
      grabCursor: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      breakpoints: {
        0: { slidesPerView: 2.3, spaceBetween: 16 },
        768: { slidesPerView: 3 },
        992: { slidesPerView: 4 },
        1200: { slidesPerView: 5 },
      },
    });
  }

  /** 🧩 Vendor CSS + JS */
  ngAfterViewInit() {
    AOS.init({
      duration: 800,
      offset: -500,
      once: true,
      easing: 'ease-out-cubic',
    });

    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/style.css',
    ];
    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const jsFiles = [
      'assets/js/vendor/modernizr-3.11.7.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      this.renderer.appendChild(document.body, script);
    });
  }

  /** 📌 Kiểm tra job hết hạn hoặc inactive */
  isExpired(job: Career): boolean {
    const now = new Date();

    const isDateExpired =
      job.expiration_date &&
      new Date(job.expiration_date).getTime() < now.getTime();

    const isInactive = job.is_active === false;

    return isDateExpired || isInactive;
  }
}
