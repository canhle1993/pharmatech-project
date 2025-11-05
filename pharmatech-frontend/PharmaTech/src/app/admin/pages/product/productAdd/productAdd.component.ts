import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { Product } from '../../../../entities/product.entity';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MultiSelectModule,
    InputNumberModule,
    RouterLink,
    FormsModule,
    EditorModule,
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

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private router: Router // ✅ thêm router
  ) {}

  async ngOnInit() {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      model: [''],
      manufacturer: [''],
      description: [''],
      specification: [''],
      price: [0, [Validators.min(0)]],
      category_ids: [[]],
    });

    // 🔹 Load danh sách category để chọn
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = res.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
      }));
    } catch (error) {
      console.error('❌ Load categories failed:', error);
    }
  }

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

    const product: Product = {
      ...this.addForm.value,
      updated_by: 'admin',
    };

    try {
      // 1️⃣ Tạo product
      const created: any = await this.productService.create(
        product,
        this.mainFile
      );
      const newProductId = created?.data?._id || created?._id;

      // 2️⃣ Upload gallery
      if (newProductId && this.galleryFiles.length > 0) {
        await this.productService.uploadGallery(
          newProductId,
          this.galleryFiles
        );
      }

      // ✅ Thông báo
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully!',
      });

      // ✅ Reset form
      this.onCancel();

      // ✅ Đợi 1.5s rồi chuyển sang product-list
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
    this.addForm.reset();
    this.mainFile = undefined;
    this.galleryFiles = [];
    this.mainPreview = null;
    this.galleryPreviews = [];
  }
}
