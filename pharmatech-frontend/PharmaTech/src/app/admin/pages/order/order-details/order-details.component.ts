import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrderService } from '../../../../services/order.service';
import { Order } from '../../../../entities/order.entity';
import { env } from '../../../../enviroments/enviroment';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OrderDetails } from '../../../../entities/order-details.entity';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-order-details',
  standalone: true,
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css'],
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule,
    RouterLink,
  ],
  providers: [MessageService],
})
export class OrderDetailsComponent implements OnInit {
  orderId!: string;
  order!: Order;
  loading = true;
  imageBase = env.imageUrl; // ✅ đường dẫn gốc

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const res: any = await this.orderService.findById(id);
      this.order = res;

      // ✅ Nếu có chi tiết sản phẩm, ghép đường dẫn ảnh
      if (this.order.details && this.order.details.length > 0) {
        this.order.details = this.order.details.map((item) => ({
          ...item,
          product_photo: item.product_photo?.includes('http')
            ? item.product_photo
            : `${this.imageBase}${item.product_photo}`,
        })) as OrderDetails[];
      }
    } catch (error) {
      console.error('❌ Load order details failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load order details.',
      });
    } finally {
      this.loading = false;
    }
  }

  async loadOrder() {
    this.loading = true;
    try {
      const res = await this.orderService.findById(this.orderId);
      this.order = res;
      console.log('🧾 Order detail:', this.order);
    } catch (err) {
      console.error('❌ loadOrder error:', err);
    } finally {
      this.loading = false;
    }
  }
}
