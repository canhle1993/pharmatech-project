import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Category } from '../../../../entities/category.entity';
import { CategoryService } from '../../../../services/category.service';
import { RouterLink } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { Select } from 'primeng/select';
import { FloatLabel } from 'primeng/floatlabel';
import { Dialog } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FilterMatchMode } from 'primeng/api'; // ✅ thêm dòng này
import { ProductService } from '../../../../services/product.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

@Component({
  templateUrl: './categorylist.component.html',
  styleUrls: ['./categorylist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    DialogModule,
    TextareaModule,
    AvatarModule,
    RouterLink,
  ],
  providers: [ConfirmationService, MessageService],
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  products: any[] = [];
  addForm!: FormGroup;
  editForm!: FormGroup;
  loading = true;
  addDialog = false;
  editDialog = false;
  selectedFile?: File;
  editFile?: File;
  editPreview?: string;
  selectedCategory?: any;

  existingCategories: Category[] = [];

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private confirmService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();

    // ⚡ Lấy tất cả categories để check duplicate
    this.categoryService.findAll().then((res: any) => {
      this.existingCategories = res || [];
    });

    this.addForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      product_id: [[]], // ✅ mảng
    });

    this.editForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      description: [''],
      product_id: [[]],
    });
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

  async loadProducts() {
    try {
      const res: any = await this.productService.findAllActive();

      // ⚡ Map lại dữ liệu cho PrimeNG MultiSelect
      this.products = res.map((p: any) => ({
        id: p._id || p.id, // Đảm bảo có id duy nhất
        name: p.name || 'Unnamed Product',
        is_delete: p.is_delete ?? false,
      }));

      console.log('✅ PRODUCTS:', this.products); // Kiểm tra trong console
    } catch (error) {
      console.error('❌ Load products error:', error);
    }
  }

  get selectedActiveCount(): number {
    const selected = this.editForm.value.product_id || [];

    // chỉ đếm product mà is_delete = false
    return selected.filter((id: string) => {
      const p = this.products.find((x) => x.id === id);
      return p?.is_delete === false; // ⭐ chỉ đếm product còn sống
    }).length;
  }

  showAddDialog() {
    this.addDialog = true;

    // setTimeout(() => {
    //   const dialogEl = document.querySelector('.p-dialog') as HTMLElement;
    //   if (dialogEl) {
    //     dialogEl.style.maxHeight = '81vh'; // ép cao hơn
    //     dialogEl.style.height = '81vh'; // giữ full
    //   }
    // }, 100);
  }

  showEditDialog(cat: any) {
    this.selectedCategory = cat;
    this.editDialog = true;
    this.editPreview = cat.photo || 'assets/images/no-image.jpg';

    // 🔹 Load chi tiết category từ API
    this.categoryService.findById(cat.id).then((res: any) => {
      const productIds = Array.isArray(res.product_ids)
        ? res.product_ids
        : (res.products || []).map((p: any) => p.id || p._id);

      // 🟢 Patch form
      this.editForm.patchValue({
        id: res.id,
        name: res.name,
        description: res.description,
        product_id: productIds,
      });

      // 🟢 Remove current category from duplicate checking list (CHUẨN)
      this.existingCategories = this.existingCategories.filter(
        (c) => (c.id || c._id) !== res.id
      );
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onCreateCategory() {
    if (this.addForm.invalid) return;

    const name = (this.addForm.value.name || '').trim().toLowerCase();

    // ❗ Check trùng name
    const exists = this.existingCategories.some(
      (c) => c.name.trim().toLowerCase() === name
    );

    if (exists) {
      this.addForm.get('name')?.setErrors({ duplicate: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate name',
        detail: 'Category name already exists. Please use another name.',
      });
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // ✅ Chuyển về mảng product_ids
    const categoryData = {
      name: this.addForm.value.name,
      description: this.addForm.value.description,
      updated_by: currentUser?.name || 'admin',
      product_ids: Array.isArray(this.addForm.value.product_id)
        ? this.addForm.value.product_id
        : [this.addForm.value.product_id], // luôn là mảng
    };

    try {
      await this.categoryService.create(categoryData, this.selectedFile);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Category created successfully.',
      });
      this.addDialog = false;
      this.loadCategories();
    } catch (error) {
      console.error('❌ Create category error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create category.',
      });
    }
  }

  /** 🟡 Chọn file khi chỉnh sửa */
  onEditFileSelected(event: any) {
    this.editFile = event.target.files[0];
    if (this.editFile) {
      const reader = new FileReader();
      reader.onload = (e) => (this.editPreview = e.target?.result as string);
      reader.readAsDataURL(this.editFile);
    }
  }

  /** 🟡 Cập nhật Category */
  async onUpdateCategory() {
    if (this.editForm.invalid) return;

    const formValue = this.editForm.value;
    const name = (formValue.name || '').trim().toLowerCase();

    // ❗ Check duplicate name
    const exists = this.existingCategories.some(
      (c) => c.name.trim().toLowerCase() === name
    );

    if (exists) {
      this.editForm.get('name')?.setErrors({ duplicate: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate name',
        detail: 'Category name already exists.',
      });
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const categoryData = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      updated_by: currentUser?.name || 'admin',
      product_ids: formValue.product_id,
    };

    try {
      await this.categoryService.update(categoryData, this.editFile);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Category updated successfully.',
      });
      this.editDialog = false;
      this.loadCategories();
    } catch (error) {
      console.error('❌ Update category error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update category.',
      });
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
