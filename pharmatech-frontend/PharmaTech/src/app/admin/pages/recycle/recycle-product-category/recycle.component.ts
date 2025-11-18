import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-recycle',
  standalone: true,
  templateUrl: './recycle.component.html',
  styleUrls: ['./recycle.component.css'],
  imports: [
    CommonModule,
    TabsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class RecycleComponent implements OnInit {
  tabs = [
    { title: '🛒 Products', value: 'product' },
    { title: '📁 Categories', value: 'category' },
  ];

  activeTab = 'product';
  loading = false;

  // 👉 FIX TYPE: luôn là array
  deletedProducts: any[] = [];
  deletedCategories: any[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private message: MessageService,
    private confirmService: ConfirmationService
  ) {}

  async ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;

    try {
      const [prodRes, catRes] = await Promise.all([
        this.productService.getDeleted(),
        this.categoryService.getDeleted(),
      ]);

      this.deletedProducts = prodRes ?? [];
      this.deletedCategories = catRes ?? [];
    } catch (err) {
      console.error(err);
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load recycle bin.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🔄 Khôi phục Product */
  /** 🔄 Khôi phục Product (có confirm) */
  async restoreProduct(item: any) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updated_by = user?.name || 'admin';

    this.confirmService.confirm({
      message: `Restore product "${item.name}"?`,
      header: 'Confirm Restore',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          const realId = item.id ?? item._id;
          await this.productService.restore(realId, updated_by);
          this.message.add({
            severity: 'success',
            summary: 'Restored',
            detail: 'Product restored successfully.',
          });
          this.loadData();
        } catch (err) {
          console.error(err);
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to restore product.',
          });
        }
      },
    });
  }

  /** 🔄 Restore Category (có confirm) */
  async restoreCategory(item: any) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updated_by = user?.name || 'admin';

    this.confirmService.confirm({
      message: `Restore category "${item.name}"?`,
      header: 'Confirm Restore',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          const realId = item.id ?? item._id;
          await this.categoryService.restore(realId, updated_by);
          this.message.add({
            severity: 'success',
            summary: 'Restored',
            detail: 'Category restored successfully.',
          });
          this.loadData();
        } catch (err) {
          console.error(err);
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to restore category.',
          });
        }
      },
    });
  }

  /** 🔥 Xóa cứng Product */
  async hardDeleteProduct(item: any) {
    if (item.hasLink) return;

    this.confirmService.confirm({
      message: `Delete product "${item.name}" permanently?`,
      header: 'Hard Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const realId = item.id ?? item._id;

          await this.productService.hardDelete(realId);
          this.message.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Product deleted permanently.',
          });
          this.loadData();
        } catch (err) {
          console.error(err);
        }
      },
    });
  }

  /** 🔥 Hard Delete Category */
  async hardDeleteCategory(item: any) {
    if (item.hasLink) return;

    this.confirmService.confirm({
      message: `Delete category "${item.name}" permanently?`,
      header: 'Hard Delete',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          const realId = item.id ?? item._id;

          await this.categoryService.hardDelete(realId);
          this.message.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Category deleted permanently.',
          });
          this.loadData();
        } catch (err) {
          console.error(err);
        }
      },
    });
  }
}
