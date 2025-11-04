import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product } from '../../../../entities/product.entity';
import { Category } from '../../../../entities/category.entity';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { RouterLink } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

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
  ],
  providers: [ConfirmationService, MessageService],
})
export class ProductListComponent implements OnInit {
  /** Danh sách sản phẩm */
  products: Product[] = [];
  /** Danh sách category */
  categories: Category[] = [];
  /** Loading spinner */
  loading = true;

  constructor(
    private productService: ProductService,
    private confirmService: ConfirmationService,
    private messageService: MessageService,
    private categoryService: CategoryService
  ) {}

  /** Khi load trang */
  async ngOnInit() {
    this.loading = true;
    try {
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
    } finally {
      this.loading = false;
    }
  }

  /** ❌ Xóa mềm sản phẩm */
  async onDelete(product: Product) {
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

          // Reload danh sách
          const reload: any = await this.productService.findAll();
          this.products = reload;
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
