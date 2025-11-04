import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../entities/product.entity';
import { env } from '../../../../enviroments/enviroment';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-product-details',
  standalone: true,
  templateUrl: './productDetails.component.html',
  styleUrls: ['./productDetails.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class ProductDetailsComponent implements OnInit {
  product!: Product;
  loading = true;
  imageBase = env.imageUrl;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const res: any = await this.productService.findById(id);
      this.product = res;

      // ✅ Ghép đường dẫn đầy đủ cho ảnh chính
      if (this.product.photo && !this.product.photo.startsWith('http')) {
        this.product.photo = `${this.imageBase}${this.product.photo}`;
      }

      // ✅ Ghép đường dẫn đầy đủ cho gallery
      if (this.product.gallery && this.product.gallery.length > 0) {
        this.product.gallery = this.product.gallery.map((img: string) =>
          img.startsWith('http') ? img : `${this.imageBase}${img}`
        );
      }
    } catch (error) {
      console.error('❌ Load product details failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load product details.',
      });
    } finally {
      this.loading = false;
    }
  }
}
