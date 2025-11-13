import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { OrderService } from '../../../../services/order.service';
import { Order } from '../../../../entities/order.entity';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ConfirmationService, MessageService } from 'primeng/api';

import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    DialogModule,
    ProgressSpinnerModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css'],
})
export class OrderHistoryComponent implements OnInit {
  loading = true;
  completedOrders: Order[] = [];

  showImageDialog = false;
  selectedImage: string | null = null;

  constructor(private orderService: OrderService, private router: Router) {}

  async ngOnInit() {
    await this.loadCompletedOrders();
  }

  async loadCompletedOrders() {
    this.loading = true;
    try {
      const allOrders = await this.orderService.findAll();
      this.completedOrders = allOrders.filter((o) => o.status === 'Completed');

      // Sort newest → oldest
      this.completedOrders.sort(
        (a, b) =>
          new Date(b.updated_at || '').getTime() -
          new Date(a.updated_at || '').getTime()
      );
    } catch (err) {
      console.error('❌ loadCompletedOrders error:', err);
    } finally {
      this.loading = false;
    }
  }

  onView(order: Order) {
    this.router.navigate(['/admin/order/order-details', order.safeId]);
  }

  openImage(url: string) {
    this.selectedImage = url;
    this.showImageDialog = true;
  }
}
