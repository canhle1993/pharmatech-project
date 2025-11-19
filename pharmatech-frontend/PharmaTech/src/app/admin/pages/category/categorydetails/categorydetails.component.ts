import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CategoryService } from '../../../../services/category.service';
import { env } from '../../../../enviroments/enviroment';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './categorydetails.component.html',
  styleUrls: ['./categorydetails.component.css'],
})
export class CategoryDetailsComponent implements OnInit {
  category: any;
  products: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading = true;
    try {
      await this.loadCategory(id);
      await this.loadProductsByCategory(id);
    } finally {
      this.loading = false;
    }
  }

  /** 🔹 Lấy chi tiết category */
  async loadCategory(id: string) {
    try {
      const res: any = await this.categoryService.findById(id);
      this.category = res;
    } catch (error) {
      console.error('❌ Load category error:', error);
    }
  }

  /** 🔹 Lấy danh sách product thuộc category này */
  async loadProductsByCategory(id: string) {
    try {
      const res: any = await this.categoryService.findProductsByCategory(id);
      this.products = res;
    } catch (error) {
      console.error('❌ Load products by category error:', error);
    }
  }

  /** 🔹 Ghép URL hình ảnh */
  getImage(url?: string): string {
    if (!url) return 'assets/images/no-image.jpg';
    return url.startsWith('http') ? url : `${env.imageUrl}${url}`;
  }
}
