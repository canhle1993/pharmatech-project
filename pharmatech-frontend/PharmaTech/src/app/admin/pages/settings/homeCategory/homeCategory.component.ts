import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CategoryService } from '../../../../services/category.service';
import { ProductService } from '../../../../services/product.service';
import { HomeCategoryService } from '../../../../services/homeCategory.service';
import { Product } from '../../../../entities/product.entity';

@Component({
  selector: 'app-home-category',
  standalone: true,
  templateUrl: './homeCategory.component.html',
  styleUrls: ['./homeCategory.component.css'],
  imports: [CommonModule, FormsModule, SelectModule, ToastModule],
  providers: [MessageService],
})
export class HomeCategoryComponent implements OnInit {
  categories: { label: string; value: string }[] = [];
  categoryProducts: { [key: number]: Product[] } = {};

  selectedCategory1: string | null = null;
  selectedCategory2: string | null = null;
  selectedCategory3: string | null = null;

  currentCategoryName1 = '';
  currentCategoryName2 = '';
  currentCategoryName3 = '';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private homeCategoryService: HomeCategoryService,
    private messageService: MessageService
  ) {}

  /** 🔹 Load danh sách category và 3 category đang lưu */
  async ngOnInit() {
    try {
      // 1️⃣ Lấy toàn bộ category để dùng cho dropdown
      const resCategories: any = await this.categoryService.findAll();
      this.categories = resCategories.map((c: any) => ({
        label: c.name,
        value: c._id || c.id,
      }));

      // 2️⃣ Lấy dữ liệu hiện đang lưu trong DB
      const res: any = await this.homeCategoryService.find();
      if (res) {
        this.selectedCategory1 = res.category1?._id || res.category1 || null;
        this.selectedCategory2 = res.category2?._id || res.category2 || null;
        this.selectedCategory3 = res.category3?._id || res.category3 || null;

        this.currentCategoryName1 = res.category1?.name || '';
        this.currentCategoryName2 = res.category2?.name || '';
        this.currentCategoryName3 = res.category3?.name || '';

        // 3️⃣ Hiển thị sản phẩm theo từng category
        if (this.selectedCategory1) await this.loadProductsForCategory(1);
        if (this.selectedCategory2) await this.loadProductsForCategory(2);
        if (this.selectedCategory3) await this.loadProductsForCategory(3);
      }
    } catch (err) {
      console.error('❌ Failed to load home categories:', err);
    }
  }

  /** 🔹 Khi chọn category mới */
  async loadProductsForCategory(index: number) {
    let selectedId: string | null = null;

    if (index === 1) selectedId = this.selectedCategory1;
    if (index === 2) selectedId = this.selectedCategory2;
    if (index === 3) selectedId = this.selectedCategory3;

    if (!selectedId) {
      this.categoryProducts[index] = [];
      return;
    }

    const resProducts: any = await this.productService.findAll();
    const categoryObj = this.categories.find((c) => c.value === selectedId);

    // ✅ Gán tên category hiện tại
    if (index === 1) this.currentCategoryName1 = categoryObj?.label || '';
    if (index === 2) this.currentCategoryName2 = categoryObj?.label || '';
    if (index === 3) this.currentCategoryName3 = categoryObj?.label || '';

    this.categoryProducts[index] = resProducts.filter((p: any) =>
      p.category_ids?.some((id: string) => id.toString() === selectedId)
    );
  }

  /** 💾 Lưu 3 category */
  async saveHomeCategories() {
    try {
      const payload = {
        category1: this.selectedCategory1,
        category2: this.selectedCategory2,
        category3: this.selectedCategory3,
      };

      await this.homeCategoryService.save(payload);

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Home categories have been saved successfully!',
      });
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save home categories.',
      });
    }
  }
}
