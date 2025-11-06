import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ thêm dòng này
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { HomeCategoryService } from '../../../services/homeCategory.service';
import { env } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [CommonModule, RouterLink], // ✅ thêm CommonModule vào đây
})
export class HomeComponent implements OnInit, AfterViewInit {
  imageBase = env.imageUrl; // ✅ thêm dòng này

  homeCategories: any = null;
  productsCat1: any[] = [];
  productsCat2: any[] = [];
  productsCat3: any[] = [];

  constructor(
    private renderer: Renderer2,
    private productService: ProductService,
    private homeCategoryService: HomeCategoryService
  ) {}

  async ngOnInit() {
    await this.loadHomeCategories();
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

  ngAfterViewInit() {
    // phần load CSS + JS giữ nguyên như cũ
  }
}
