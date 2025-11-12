import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrderService } from '../../../../services/order.service';
import { Order } from '../../../../entities/order.entity';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI

@Component({
  templateUrl: './orderlist.component.html',
  styleUrls: ['./orderlist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TabsModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    InputTextModule, // 🆕 CODE MỚI
    IconFieldModule, // 🆕 CODE MỚI
    InputIconModule, // 🆕 CODE MỚI
    FormsModule, // 🆕 CODE MỚI
  ],
  providers: [MessageService, ConfirmationService],
})
export class OrderListComponent implements OnInit {
  // ==================================================
  // 🧩 DỮ LIỆU
  // ==================================================
  orders: Order[] = [];
  pendingOrders: Order[] = [];
  approvedOrders: Order[] = [];
  rejectedOrders: Order[] = [];

  tabs: { title: string; value: string }[] = [];
  activeTab: string = 'Pending Approval';
  loading = true;
  searchText: string = '';
  private searchTimeout?: any;
  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private confirmService: ConfirmationService
  ) {}

  // ==================================================
  // 🔄 KHỞI TẠO
  // ==================================================
  async ngOnInit() {
    // ✅ Khởi tạo các tab hiển thị
    this.tabs = [
      { title: '🕓 Pending', value: 'Pending Approval' },
      { title: '✅ Approved', value: 'Approved' },
      { title: '❌ Rejected', value: 'Rejected' },
    ];

    // ✅ Tải dữ liệu ban đầu
    await this.loadOrders();
  }

  /** 🔹 Tải danh sách đơn hàng */
  async loadOrders() {
    this.loading = true;
    try {
      const res = await this.orderService.findAll();
      this.orders = res || [];

      // ✅ Phân loại theo trạng thái phê duyệt
      this.pendingOrders = this.orders.filter(
        (o) => o.approval_status === 'Pending Approval'
      );
      this.approvedOrders = this.orders.filter(
        (o) => o.approval_status === 'Approved'
      );
      this.rejectedOrders = this.orders.filter(
        (o) => o.approval_status === 'Rejected'
      );
    } catch (error) {
      console.error('❌ loadOrders error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load orders.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🔍 Khi người dùng nhập tìm kiếm */
  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      // Chỉ chạy filter sau 300ms ngừng gõ
    }, 300);
  }

  /** 🔍 Lọc đơn hàng theo tab và từ khóa */
  getFilteredOrders(tabValue: string): Order[] {
    const baseOrders = this.getOrdersByTab(tabValue);

    if (!this.searchText.trim()) return baseOrders;

    const keyword = this.searchText.toLowerCase();
    return baseOrders.filter(
      (o) =>
        o.contact_name?.toLowerCase().includes(keyword) ||
        o.safeId?.toLowerCase().includes(keyword)
    );
  }

  async onUpdateStatus(order: Order) {
    this.confirmService.confirm({
      message: `Change overall status for order #${order.safeId}?`,
      header: 'Update Order Status',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          await this.orderService.updateStatus(
            order.safeId!,
            'Completed', // 🟢 hoặc sau này bạn mở dropdown chọn
            'admin'
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Order #${order.safeId} status changed successfully.`,
          });
          await this.loadOrders();
        } catch (err) {
          console.error('❌ onUpdateStatus error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update order status.',
          });
        }
      },
    });
  }

  // ==================================================
  // ✅ DUYỆT / TỪ CHỐI / HỦY
  // ==================================================
  /** 🔸 Phê duyệt đơn hàng */
  async onApprove(order: Order) {
    console.log('🧾 order object:', order);

    this.confirmService.confirm({
      message: `Approve order #${order.safeId}?`,
      header: 'Confirm Approval',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';

          await this.orderService.updateApproval(
            order.safeId!,
            'Approved',
            updated_by
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: `Order #${order.safeId} has been approved.`,
          });

          await this.loadOrders();
        } catch (err) {
          console.error('❌ onApprove error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to approve order.',
          });
        }
      },
    });
  }

  /** 🔸 Từ chối đơn hàng */
  async onReject(order: Order) {
    this.confirmService.confirm({
      message: `Reject order #${order.safeId}?`,
      header: 'Confirm Rejection',
      icon: 'pi pi-times-circle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';

          await this.orderService.updateApproval(
            order.safeId!,
            'Rejected',
            updated_by
          );

          this.messageService.add({
            severity: 'warn',
            summary: 'Rejected',
            detail: `Order #${order.safeId} has been rejected.`,
          });

          await this.loadOrders();
        } catch (err) {
          console.error('❌ onReject error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to reject order.',
          });
        }
      },
    });
  }

  /** 🔸 Hủy đơn hàng */
  async onCancel(order: Order) {
    this.confirmService.confirm({
      message: `Cancel order #${order.safeId}?`,
      header: 'Cancel Order',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.orderService.cancelOrder(order.safeId!, 'admin');
          this.messageService.add({
            severity: 'info',
            summary: 'Cancelled',
            detail: `Order #${order.safeId} has been cancelled.`,
          });

          await this.loadOrders();
        } catch (err) {
          console.error('❌ onCancel error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to cancel order.',
          });
        }
      },
    });
  }

  // ==================================================
  // 📦 XEM CHI TIẾT
  // ==================================================
  /** 🔍 Xem chi tiết đơn hàng */
  async onView(order: Order) {
    console.log('🧾 View order detail:', order.safeId);
    // TODO: Mở dialog chi tiết (OrderDetailDialogComponent)
  }

  // ==================================================
  // 💡 UI HELPER
  // ==================================================
  /** 🎨 Trả về màu tag cho trạng thái */
  getBadgeSeverity(
    status: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending Approval':
        return 'warn';
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  /** 📊 Trả về danh sách đơn hàng theo tab */
  getOrdersByTab(tabValue: string): Order[] {
    switch (tabValue) {
      case 'Approved':
        return this.approvedOrders;
      case 'Rejected':
        return this.rejectedOrders;
      default:
        return this.pendingOrders;
    }
  }
}
