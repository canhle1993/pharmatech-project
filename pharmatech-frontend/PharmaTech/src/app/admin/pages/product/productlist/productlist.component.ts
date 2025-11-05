import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
<<<<<<< HEAD
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product } from '../../../../entities/product.entity';
import { Category } from '../../../../entities/category.entity';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
=======
import {
  ConfirmationService,
  FilterService,
  MessageService,
} from 'primeng/api';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { RouterLink } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
>>>>>>> origin/main

@Component({
  templateUrl: './productlist.component.html',
  styleUrls: ['./productlist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
<<<<<<< HEAD
  ],
  providers: [ConfirmationService, MessageService],
})
export class ProductListComponent implements OnInit {
  products: Product[];
  categories: Category[];
=======
    RouterLink,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    FloatLabel,
    SelectModule,
    FormsModule,
  ],
  providers: [ConfirmationService, MessageService, FilterService],
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: { label: string; value: string }[] = [];
  selectedCategory: string | null = null;
>>>>>>> origin/main
  loading = true;

  constructor(
    private productService: ProductService,
<<<<<<< HEAD
    private confirmService: ConfirmationService,
    private messageService: MessageService,
    private categoryService: CategoryService
=======
    private categoryService: CategoryService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
>>>>>>> origin/main
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
<<<<<<< HEAD
      // 🔹 Load sản phẩm
      const resProducts: any = await this.productService.findAll();
      this.products = resProducts;

      // 🔹 Load danh mục
      const resCategories: any = await this.categoryService.findAll();
      this.categories = resCategories;
    } catch (error) {
      console.error('❌ Failed to load products or categories:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load product list.',
      });
=======
      // ✅ Load products
      const resProducts: any = await this.productService.findAll();
      this.products = resProducts;
      this.filteredProducts = [...this.products];

      // ✅ Load categories
      const resCategories: any = await this.categoryService.findAll();
      this.categories = resCategories.map((c: any) => ({
        label: c.name,
        value: c._id || c.id, // dùng id hoặc _id đều ổn
      }));
>>>>>>> origin/main
    } finally {
      this.loading = false;
    }
  }

<<<<<<< HEAD
  getCategoryName(categoryId: string): string {
    const cat = this.categories.find((c) => c.id === categoryId);
    return cat ? cat.name : '-';
  }
  async onDelete(product: Product) {
=======
  /** 🔍 Search global */
  onGlobalFilter(event: Event, table: any) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  /** 🧩 Filter theo category */
  applyFilters(categoryId: string | null) {
    this.selectedCategory = categoryId;
    if (!categoryId) {
      this.filteredProducts = [...this.products];
      return;
    }

    const pick = categoryId.toString();

    this.filteredProducts = this.products.filter((p: any) => {
      // ✅ Trường hợp 1: mảng category_ids
      if (Array.isArray(p.category_ids) && p.category_ids.includes(pick))
        return true;

      // ✅ Trường hợp 2: mảng categories (populate object)
      if (
        Array.isArray(p.categories) &&
        p.categories.some((c: any) => c?.id === pick || c?._id === pick)
      )
        return true;

      return false;
    });

    console.log('✅ Filtered products:', this.filteredProducts);
  }

  /** ❌ Soft delete */
  async onDelete(product: any) {
>>>>>>> origin/main
    this.confirmService.confirm({
      message: `Are you sure you want to delete the product "${product.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';
<<<<<<< HEAD

          await this.productService.softDelete(product.id!, updated_by);

=======
          await this.productService.softDelete(product.id!, updated_by);
>>>>>>> origin/main
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Product "${product.name}" has been deleted.`,
          });
<<<<<<< HEAD

          // Reload list
          this.productService
            .findAll()
            .then((res) => (this.products = res as Product[]));
=======
          const reload: any = await this.productService.findAll();
          this.products = reload;
          this.applyFilters(this.selectedCategory); // ✅ Giữ filter hiện tại
>>>>>>> origin/main
        } catch (error) {
          console.error('❌ Delete product error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete product.',
          });
        }
      },
    });
  }
}
