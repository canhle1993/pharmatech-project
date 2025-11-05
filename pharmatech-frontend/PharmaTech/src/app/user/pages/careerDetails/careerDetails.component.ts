import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';
import { CommonModule, DatePipe } from '@angular/common';
@Component({
  templateUrl: './careerDetails.component.html',
  imports: [CommonModule],
  providers: [DatePipe],
  styleUrls: ['./careerDetails.component.css'],
})
export class CareerDetailsComponent implements OnInit, AfterViewInit {
  career?: Career;
  loading = true;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private careerService: CareerService
  ) {}

  async ngOnInit() {
    // 🔹 Lấy ID từ URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadCareer(id);
    }
  }

  /** 🔹 Hàm gọi API lấy chi tiết bài đăng */
  async loadCareer(id: string) {
    try {
      const res = await this.careerService.findById(id);
      this.career = res as Career;
    } catch (err) {
      console.error('❌ Error', err);
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit() {
    // --- CSS ---
    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];
    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    // --- Font ---
    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
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
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
