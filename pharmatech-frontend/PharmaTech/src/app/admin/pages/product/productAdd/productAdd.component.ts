import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { Product } from '../../../../entities/product.entity';
import { EditorModule } from 'primeng/editor';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';

// 🧩 Thêm Quill
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import QuillBetterTable from 'quill-better-table';

// 🔹 Đăng ký module bảng
Quill.register({ 'modules/better-table': QuillBetterTable }, true);

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ToastModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MultiSelectModule,
    InputNumberModule,
    QuillModule,
    EditorModule, // ✅ thêm dòng này
  ],
  templateUrl: './productAdd.component.html',
  styleUrls: ['./productAdd.component.css'],

  providers: [MessageService],
})
export class ProductAddComponent implements OnInit {
  addForm!: FormGroup;
  mainFile?: File;
  galleryFiles: File[] = [];
  mainPreview: string | null = null;
  galleryPreviews: string[] = [];
  categories: any[] = [];
  loading = false;

  existingProducts: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      model: [''],
      introduce: [''],
      description: [''],
      specification: [''], // dùng Quill editor cho trường này
      price: [0, [Validators.min(0)]],
      category_ids: [[]],
      stock_quantity: [0, [Validators.min(0)]],
    });

    // 🔹 Load danh sách category
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = res.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
      }));
    } catch (error) {
      console.error('❌ Load categories failed:', error);
    }

    // 🔹 Load tất cả product để kiểm tra trùng name/model
    try {
      const productsRes: any = await this.productService.findAll();
      this.existingProducts = productsRes || [];
    } catch (error) {
      console.error('❌ Load products failed (for duplicate check):', error);
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

  /** 📸 Ảnh phụ */
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

  /** 🧾 Tạo sản phẩm mới */
  async onCreateProduct() {
    if (this.addForm.invalid) return;
    this.loading = true;

    const formValue = this.addForm.value;
    const name = (formValue.name || '').trim();
    const model = (formValue.model || '').trim();

    // 🔍 Check trùng name (case-insensitive)
    const nameExists = this.existingProducts.some(
      (p) => p.name && p.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      this.addForm.get('name')?.setErrors({ duplicate: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate name',
        detail: 'Product name already exists. Please choose another name.',
      });
      this.loading = false;
      return;
    }

    // 🔍 Check trùng model (nếu có nhập)
    if (model) {
      const modelExists = this.existingProducts.some(
        (p) => p.model && p.model.trim().toLowerCase() === model.toLowerCase()
      );

      if (modelExists) {
        this.addForm.get('model')?.setErrors({ duplicate: true });
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicate model',
          detail: 'Product model already exists. Please choose another model.',
        });
        this.loading = false;
        return;
      }
    }

    const stock_status =
      formValue.stock_quantity && formValue.stock_quantity > 0
        ? 'in_stock'
        : 'out_of_stock';

    const product: Product = {
      ...formValue,
      stock_status,
      updated_by: 'admin',
    };

    try {
      const created: any = await this.productService.create(
        product,
        this.mainFile
      );
      const newProductId = created?.data?._id || created?._id;

      if (newProductId && this.galleryFiles.length > 0) {
        await this.productService.uploadGallery(
          newProductId,
          this.galleryFiles
        );
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully!',
      });

      this.onCancel();

      setTimeout(() => {
        this.router.navigate(['/admin/product-list']);
      }, 1500);
    } catch (error) {
      console.error('❌ Create product error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create product.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** ❌ Reset form */
  onCancel() {
    this.addForm.reset({
      price: 0,
      stock_quantity: 0,
    });
    this.mainFile = undefined;
    this.galleryFiles = [];
    this.mainPreview = null;
    this.galleryPreviews = [];
  }
}
