import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ thêm dòng này
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { HomeCategoryService } from '../../../services/homeCategory.service';
import { env } from '../../../enviroments/enviroment';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterLink], // ✅ thêm CommonModule vào đây
})
export class HomeComponent implements OnInit, AfterViewInit {
  imageBase = env.imageUrl; // ✅ thêm dòng này
  careers: Career[] = [];

  homeCategories: any = null;
  productsCat1: any[] = [];
  productsCat2: any[] = [];
  productsCat3: any[] = [];

  constructor(
    private renderer: Renderer2,
    private productService: ProductService,
    private homeCategoryService: HomeCategoryService,
    private careerService: CareerService // ✅ thêm dòng này
  ) {}

  async ngOnInit() {
    await this.loadHomeCategories();
    await this.loadCareers(); // ✅ thêm gọi API career
  }

  async loadHomeCategories() {
    try {
      const res: any = await this.homeCategoryService.find();
      console.log('✅ API Home Categories:', res);
      this.homeCategories = res;

      const allProducts: any = await this.productService.findAll();
      console.log('✅ Tổng sản phẩm:', allProducts.length);

      if (res.category1)
        this.productsCat1 = allProducts.filter((p: any) =>
          p.category_ids?.some(
            (id: any) =>
              id?.toString() ===
              (res.category1._id?.toString() || res.category1.toString())
          )
        );

      if (res.category2)
        this.productsCat2 = allProducts.filter((p: any) =>
          p.category_ids?.some(
            (id: any) =>
              id?.toString() ===
              (res.category2._id?.toString() || res.category2.toString())
          )
        );

      if (res.category3)
        this.productsCat3 = allProducts.filter((p: any) =>
          p.category_ids?.some(
            (id: any) =>
              id?.toString() ===
              (res.category3._id?.toString() || res.category3.toString())
          )
        );

      console.log('✅ Cat1:', this.productsCat1);
      console.log('✅ Cat2:', this.productsCat2);
      console.log('✅ Cat3:', this.productsCat3);
    } catch (err) {
      console.error('❌ Lỗi tải Home Categories:', err);
    }
  }

  /** 🔹 Load danh sách job */
  async loadCareers() {
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];
    } catch (err) {
      console.error('❌ Lỗi tải Career:', err);
    }
  }

  truncateHTML(html: string, wordLimit: number): string {
    if (!html) return '';
    // Xóa thẻ HTML để tính số từ
    const text = html.replace(/<[^>]*>/g, '').split(/\s+/);
    const truncated = text.slice(0, wordLimit).join(' ');
    return truncated + (text.length > wordLimit ? '...' : '');
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
