import {
  Component,
  OnInit,
  AfterViewInit,
  Renderer2,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

declare var Swiper: any; // dùng thư viện swiper có sẵn trong assets

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

  /** 🔹 Gọi API lấy danh sách job */
  async loadCareers() {
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];

      // ✅ Gom nhóm theo field
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

      // mặc định hiển thị tất cả
      this.filteredCareers = [...this.careers];
    } catch (err) {
      console.error('❌ Lỗi load career:', err);
    } finally {
      this.loading = false;
      // khởi tạo swiper sau khi load xong
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

  /** 🧭 Khởi tạo swiper */
  private initSwiper() {
    new Swiper('.field-swiper', {
      modules: [Navigation],
      slidesPerView: 5,
      spaceBetween: 25,
      grabCursor: true, // kéo bằng chuột
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

  /** 🧩 Load CSS + JS vendor */
  ngAfterViewInit() {
    // Khởi tạo AOS
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
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      this.renderer.appendChild(document.body, script);
    });
  }
}
