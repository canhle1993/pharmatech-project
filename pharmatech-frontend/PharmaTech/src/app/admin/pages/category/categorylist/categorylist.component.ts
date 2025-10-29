import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Category } from '../../../../entities/category.entity';
import { CategoryService } from '../../../../services/category.service';

@Component({
  templateUrl: './categorylist.component.html',
  styleUrls: ['./categorylist.component.css'],
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
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = true;

  constructor(
    private categoryService: CategoryService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  /** 🔹 Load all categories */
  async loadCategories() {
    this.loading = true;
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = res;
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load categories.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🔹 Soft delete a category */
  async onDelete(category: Category) {
    this.confirmService.confirm({
      message: `Are you sure you want to delete the category "${category.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';

          await this.categoryService.softDelete(category.id!, updated_by);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Category "${category.name}" has been deleted.`,
          });

          this.loadCategories();
        } catch (error) {
          console.error('❌ Delete category error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete category.',
          });
        }
      },
    });
  }
}
