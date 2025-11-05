import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
  loading = true;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
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
    } finally {
      this.loading = false;
    }
  }

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
          await this.productService.softDelete(product.id!, updated_by);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Product "${product.name}" has been deleted.`,
          });
          const reload: any = await this.productService.findAll();
          this.products = reload;
          this.applyFilters(this.selectedCategory); // ✅ Giữ filter hiện tại
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
