import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { BannerService, Banner } from '../../../services/banner.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
})
export class CarouselComponent implements OnInit, AfterViewInit {
  bannerData: Banner | null = null;
  slide1Url = '';
  slide2Url = '';
  slide3Url = '';

  constructor(
    private bannerService: BannerService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    await this.loadBanner();
  }

  async loadBanner() {
    try {
      const response = await firstValueFrom(this.bannerService.getBanner());
      this.bannerData = response.data;

      // Build full URLs for the images
      this.slide1Url =
        this.buildImageUrl(this.bannerData['slide1']) ||
        'assets/images/slider/slider-5-1.jpg';
      this.slide2Url =
        this.buildImageUrl(this.bannerData['slide2']) ||
        'assets/images/slider/slider-5-2.jpg';
      this.slide3Url =
        this.buildImageUrl(this.bannerData['slide3']) ||
        'assets/images/slider/slider-5-3.jpg';
    } catch (error) {
      console.error('Error loading banner:', error);
      // Fallback to default images
      this.slide1Url = 'assets/images/slider/slider-5-1.jpg';
      this.slide2Url = 'assets/images/slider/slider-5-2.jpg';
      this.slide3Url = 'assets/images/slider/slider-5-3.jpg';
    }
  }

  buildImageUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('assets/')) return path;
    return `http://localhost:3000${path}`;
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

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
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
