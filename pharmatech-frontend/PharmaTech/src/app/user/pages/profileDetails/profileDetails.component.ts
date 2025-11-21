import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Order } from '../../../entities/order.entity';
import { env } from '../../../enviroments/enviroment';
import { OrderService } from '../../../services/order.service';
import { OrderDetails } from '../../../entities/order-details.entity';

import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'profile-details',
  standalone: true,
  templateUrl: './profileDetails.component.html',
  styleUrls: ['./profileDetails.component.css'],
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
    DialogModule,
    FileUploadModule,
  ],
  providers: [MessageService],
})
export class ProfileDetailsComponent implements OnInit {
  orderId!: string;
  order!: Order;
  loading = true;
  imageBase = env.imageUrl; // ✅ đường dẫn gốc
  showImagePreview: boolean = false;
  previewImageUrl: string = '';
  userId: string = localStorage.getItem('userId') || '';

  pendingOrders: Order[] = [];
  approvedOrders: Order[] = [];
  paidFullOrders: Order[] = []; // 🆕 BẮT BUỘC PHẢI CÓ
  rejectedOrders: Order[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router, // ⭐ THÊM ROUTER

    private orderService: OrderService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const res: any = await this.orderService.findById(id);
      this.order = Object.assign(new Order(), res);

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
  // ⭐⭐⭐ HÀM BACK CHUẨN — CHUYỂN VỀ PROFILE & MỞ TAB ORDERS
  goBack() {
    if (!this.userId) {
      console.warn('⚠️ Missing user ID — cannot go back');
      return;
    }

    this.router.navigate(['/profile', this.userId], {
      queryParams: { openTab: 'orders' },
    });
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
  openImagePreview(url: string) {
    this.previewImageUrl = url;
    this.showImagePreview = true;
  }
  getApprovalBadge(status: string) {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending Approval':
        return 'warn';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }
  getOrderStatusBadge(status: string) {
    const val = status?.toLowerCase().trim();

    if (!val) return 'secondary';

    if (val.includes('paid in full')) return 'success';
    if (val.includes('deposit')) return 'info';
    if (val.includes('completed')) return 'success';
    if (val.includes('refunded')) return 'info';
    if (val.includes('cancel')) return 'danger';
    if (val.includes('pending')) return 'warn';
    if (val.includes('reject')) return 'danger';

    return 'secondary';
  }

  /** 📊 Trả về danh sách đơn hàng theo tab */
  getOrdersByTab(tabValue: string): Order[] {
    switch (tabValue) {
      case 'Approved':
        return this.approvedOrders;
      case 'PaidFull': // 🆕 TAB mới
        return this.paidFullOrders;
      case 'Rejected':
        return this.rejectedOrders;
      default:
        return this.pendingOrders;
    }
  }

  getRefundBadge(status: string) {
    const s = (status || '').toLowerCase();

    switch (s) {
      case 'none':
        return 'secondary'; // xám, không hoàn cọc
      case 'deposit lost':
        return 'danger'; // đỏ – mất cọc
      case 'deposit refunded':
        return 'success'; // xanh – đã hoàn cọc
      default:
        return 'info';
    }
  }
}
