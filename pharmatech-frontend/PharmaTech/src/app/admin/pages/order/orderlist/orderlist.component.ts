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
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

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
    DialogModule,
    FileUploadModule,
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
  paidFullOrders: Order[] = []; // 🆕 BẮT BUỘC PHẢI CÓ
  rejectedOrders: Order[] = [];

  showImagePreview: boolean = false;
  previewImageUrl: string = '';

  showPaymentDialog = false;
  paymentData = {
    remaining_payment_method: '',
    remaining_payment_note: '',
    payment_proof_url: '',
  };
  selectedOrder!: Order;

  tabs: { title: string; value: string }[] = [];
  activeTab: string = 'Pending Approval';
  loading = true;
  searchText: string = '';
  private searchTimeout?: any;
  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private confirmService: ConfirmationService,
    private router: Router
  ) {}

  // ==================================================
  // 🔄 KHỞI TẠO
  // ==================================================
  async ngOnInit() {
    // ✅ Khởi tạo các tab hiển thị
    this.tabs = [
      { title: '🕓 Pending', value: 'Pending Approval' },
      { title: '✅ Approved', value: 'Approved' },
      { title: '💳 Paid in Full', value: 'PaidFull' }, // 🆕 CHỈ DÙNG GIÁ TRỊ NGẮN
      { title: '❌ Rejected', value: 'Rejected' },
    ];

    // ✅ Tải dữ liệu ban đầu
    await this.loadOrders();
  }
  async onUploadProof(event: any) {
    const file = event.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await this.orderService.uploadProofTemp(formData);
      this.paymentData.payment_proof_url = res.url; // từ backend trả về
    } catch (err) {
      console.error(err);
    }
  }

  openImagePreview(url: string) {
    this.previewImageUrl = url;
    this.showImagePreview = true;
  }

  async onUpdateStatus(order: Order) {
    // 🔹 Lưu order đang chọn
    this.selectedOrder = order;

    // 🔹 Reset form (hoặc có thể prefill nếu sau này muốn)
    this.paymentData = {
      remaining_payment_method: '',
      remaining_payment_note: '',
      payment_proof_url: '',
    };

    // 🔹 Mở dialog
    this.showPaymentDialog = true;
  }
  async confirmUpdatePayment() {
    if (!this.selectedOrder?.safeId) return;

    // Validate đơn giản
    if (!this.paymentData.remaining_payment_method) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing',
        detail: 'Please enter remaining payment method.',
      });
      return;
    }

    this.confirmService.confirm({
      message: `Confirm full payment for order #${this.selectedOrder.safeId}?`,
      header: 'Confirm Full Payment',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          this.loading = true;

          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';

          await this.orderService.updatePaymentInfo(
            this.selectedOrder!.safeId!,
            {
              remaining_payment_method:
                this.paymentData.remaining_payment_method,
              remaining_payment_note: this.paymentData.remaining_payment_note,
              payment_proof_url: this.paymentData.payment_proof_url,
              updated_by,
            }
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Paid in Full',
            detail: `Order #${
              this.selectedOrder!.safeId
            } updated to Paid in Full.`,
          });

          this.showPaymentDialog = false;
          await this.loadOrders();

          // 🔁 Sau khi thanh toán đủ → nhảy sang Tab "Paid in Full"
          setTimeout(() => {
            this.activeTab = 'PaidFull';
          });
        } catch (err) {
          console.error('❌ confirmUpdatePayment error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update payment info.',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }

  async onCompleted(order: Order) {
    this.confirmService.confirm({
      message: `Mark order #${order.safeId} as Completed?`,
      header: 'Confirm Complete',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';

          await this.orderService.markCompleted(order.safeId!, updated_by);

          this.messageService.add({
            severity: 'success',
            summary: 'Completed',
            detail: `Order #${order.safeId} is now Completed and items Delivered.`,
          });

          await this.loadOrders();
          this.activeTab = 'PaidFull'; // optional
        } catch (err) {
          console.error('❌ onCompleted error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to mark order as completed.',
          });
        }
      },
    });
  }

  async submitPaymentInfo() {
    if (!this.selectedOrder) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    try {
      this.loading = true;

      await this.orderService.updatePaymentInfo(this.selectedOrder.safeId!, {
        ...this.paymentData,
        updated_by: currentUser?.name || 'admin',
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Payment info updated successfully.',
      });

      this.showPaymentDialog = false;

      await this.loadOrders(); // 🔄 refresh tab
    } catch (err) {
      console.error('❌ submitPaymentInfo error', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update payment info.',
      });
    } finally {
      this.loading = false;
    }
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
        (o) => o.approval_status === 'Approved' && o.status === 'Deposit Paid'
      );
      this.paidFullOrders = this.orders.filter(
        (o) => o.status === 'Paid in Full'
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

  // ==================================================
  // ✅ DUYỆT / TỪ CHỐI / HỦY
  // ==================================================
  /** 🔸 Phê duyệt đơn hàng */
  async onApprove(order: Order) {
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

          // 🔥 API mới đã tự update OrderDetails → Preparing
          const res = await this.orderService.updateApproval(
            order.safeId!,
            'Approved',
            updated_by
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: `Order #${order.safeId} has been approved and items changed to Preparing.`,
          });

          await this.loadOrders(); // 🔄 Reload lại danh sách

          // 🔥🔥 FIX: Chuyển qua tab Approved ngay lập tức
          setTimeout(() => {
            this.activeTab = 'Approved';
          });
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
  /** 🔍 Xem chi tiết đơn hàng */
  async onView(order: Order) {
    if (!order.safeId) {
      console.warn('⚠️ Order ID is missing:', order);
      return;
    }

    // ✅ Chuyển sang trang chi tiết đơn hàng
    this.router.navigate(['/admin/order/order-details', order.safeId]);
  }

  // ==================================================
  // 💡 UI HELPER
  // ==================================================
  /** 🎨 Trả về màu tag cho trạng thái */
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
    switch (status) {
      case 'Deposit Paid':
        return 'info';
      case 'Paid in Full':
        return 'success';
      case 'Cancelled':
        return 'danger';
      case 'Pending':
        return 'warn';
      default:
        return 'secondary';
    }
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
}
