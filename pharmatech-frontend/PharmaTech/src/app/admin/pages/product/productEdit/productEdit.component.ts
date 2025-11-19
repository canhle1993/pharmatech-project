import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { Product } from '../../../../entities/product.entity';
import { env } from '../../../../enviroments/enviroment';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { EditorModule } from 'primeng/editor';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// 🧩 Thêm Quill
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import QuillBetterTable from 'quill-better-table';

// 🔹 Đăng ký module bảng
Quill.register({ 'modules/better-table': QuillBetterTable }, true);

@Component({
  selector: 'app-product-edit',
  standalone: true,
  templateUrl: './productEdit.component.html',
  styleUrls: ['./productEdit.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    InputNumberModule,
    EditorModule,
    ProgressSpinnerModule,
    QuillModule,
  ],
  providers: [MessageService],
})
export class ProductEditComponent implements OnInit {
  editForm!: FormGroup;
  product!: Product;
  categories: any[] = [];
  mainFile?: File;
  galleryFiles: File[] = [];
  mainPreview: string | null = null;
  galleryPreviews: string[] = [];
  loading = true;
  imageBase = env.imageUrl;

  existingProducts: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // ✅ Khởi tạo form trống
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      model: [''],
      introduce: [''],
      price: [0, [Validators.min(0)]],
      category_ids: [[]],
      specification: [''],
      description: [''],
      /** ✅ Thêm field tồn kho (nhập số lượng) */
      stock_quantity: [0, [Validators.min(0)]],
    });

    try {
      // 🔹 Load categories
      const resCat: any = await this.categoryService.findAll();
      this.categories = resCat.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
      }));

      // ============================================================
      // 2️⃣ LOAD TOÀN BỘ PRODUCT (để kiểm tra trùng name/model)
      // ============================================================
      try {
        const allProducts: any = await this.productService.findAll();
        this.existingProducts = allProducts || [];
      } catch (err) {
        console.error('❌ Load existing products failed:', err);
      }

      // 🔹 Load product
      const res: any = await this.productService.findById(id);
      this.product = res;

      // 🔥 Remove current product from duplicate checking list
      this.existingProducts = this.existingProducts.filter(
        (p) => (p.id || p._id) !== (this.product.id || this.product._id)
      );

      // ✅ Chuẩn hóa category IDs
      const selectedCategories = Array.isArray(this.product.category_ids)
        ? this.product.category_ids.map((c: any) =>
            typeof c === 'object' ? c._id || c.id || c : c
          )
        : [];

      // ✅ Gán form
      this.editForm.patchValue({
        name: this.product.name,
        model: this.product.model,
        introduce: this.product.introduce,
        price: this.product.price,
        specification: this.product.specification,
        description: this.product.description,
        category_ids: selectedCategories,
        stock_quantity: this.product.stock_quantity || 0, // ✅ load sẵn tồn kho
      });

      // ✅ Hiển thị ảnh chính
      if (this.product.photo) {
        this.mainPreview = this.product.photo.startsWith('http')
          ? this.product.photo
          : `${this.imageBase}${this.product.photo}`;
      }

      // ✅ Hiển thị gallery
      if (this.product.gallery && this.product.gallery.length > 0) {
        this.galleryPreviews = this.product.gallery.map((img: string) =>
          img.startsWith('http') ? img : `${this.imageBase}${img}`
        );
      }
    } catch (error) {
      console.error('❌ Load product for edit failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load product details.',
      });
    } finally {
      this.loading = false;
    }
  }
  // ⚙️ Cấu hình Quill (có Table)
  editorModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean'],
        ['table'], // ✅ nút Table thật
      ],
      handlers: {
        table: function (this: any) {
          const tableModule = this.quill.getModule('better-table');
          if (tableModule) tableModule.insertTable(3, 3);
        },
      },
    },
    'better-table': {
      operationMenu: {
        items: {
          insertColumnRight: true,
          insertColumnLeft: true,
          insertRowUp: true,
          insertRowDown: true,
          deleteColumn: true,
          deleteRow: true,
        },
      },
    },
  };

  /** 📸 Ảnh chính */
  onMainFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.mainFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.mainPreview = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  /** 📸 Ảnh gallery */
  onGallerySelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.galleryFiles = Array.from(files);
      this.galleryPreviews = [];
      this.galleryFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => this.galleryPreviews.push(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  }

  /** 💾 Cập nhật */
  async onUpdateProduct() {
    if (this.editForm.invalid) return;
    this.loading = true;

    // ✅ Tự tính trạng thái tồn kho (frontend hỗ trợ logic)
    const formValue = this.editForm.value;
    const name = (formValue.name || '').trim();
    const model = (formValue.model || '').trim();

    // ⭐ Kiểm tra trùng name
    const nameExists = this.existingProducts.some(
      (p) => p.name && p.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      this.editForm.get('name')?.setErrors({ duplicate: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate name',
        detail: 'Product name already exists. Please choose another name.',
      });
      this.loading = false;
      return;
    }

    // ⭐ Kiểm tra trùng model (nếu có nhập)
    if (model) {
      const modelExists = this.existingProducts.some(
        (p) => p.model && p.model.trim().toLowerCase() === model.toLowerCase()
      );

      if (modelExists) {
        this.editForm.get('model')?.setErrors({ duplicate: true });
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicate model',
          detail: 'Product model already exists. Please choose another model.',
        });
        this.loading = false;
        return;
      }
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const stock_status =
      formValue.stock_quantity && formValue.stock_quantity > 0
        ? 'in_stock'
        : 'out_of_stock';

    const productData: Product = {
      ...formValue,
      id: this.product.id || this.product._id,
      stock_status, // tự động tính
      updated_by: currentUser?.name || 'admin',
    };

    try {
      await this.productService.update(
        productData,
        this.mainFile,
        this.galleryFiles
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Product updated successfully!',
      });

      setTimeout(() => this.router.navigate(['/admin/product-list']), 800);
    } catch (error) {
      console.error('❌ Update failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update product.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🔙 Quay lại */
  goBack() {
    this.router.navigate(['/admin/product-list']);
  }
}
