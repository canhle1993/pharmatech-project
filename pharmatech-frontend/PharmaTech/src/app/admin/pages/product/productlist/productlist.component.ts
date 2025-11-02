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
  ],
  providers: [ConfirmationService, MessageService],
})
export class ProductListComponent implements OnInit {
  products: Product[];
  categories: Category[];
  loading = true;

  constructor(
    private productService: ProductService,
    private confirmService: ConfirmationService,
    private messageService: MessageService,
    private categoryService: CategoryService
  ) {}

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

  getCategoryName(categoryId: string): string {
    const cat = this.categories.find((c) => c.id === categoryId);
    return cat ? cat.name : '-';
  }
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

          // Reload list
          this.productService
            .findAll()
            .then((res) => (this.products = res as Product[]));
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
