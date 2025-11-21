import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
    DialogModule,
    FileUploadModule,
  ],
  providers: [MessageService],
})
export class OrderDetailsComponent implements OnInit {
  orderId!: string;
  order!: Order;
  loading = true;
  imageBase = env.imageUrl; // ✅ đường dẫn gốc
  showImagePreview: boolean = false;
  previewImageUrl: string = '';
  pendingOrders: Order[] = [];
  approvedOrders: Order[] = [];
  paidFullOrders: Order[] = []; // 🆕 BẮT BUỘC PHẢI CÓ
  rejectedOrders: Order[] = [];
  previousUrl: string | null = null;
  tabAfterBack: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private messageService: MessageService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.previousUrl = this.route.snapshot.queryParamMap.get('from');
    this.tabAfterBack = this.route.snapshot.queryParamMap.get('tab');

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
  async exportInvoicePDF() {
    if (!this.order) return;

    const doc = new jsPDF('p', 'mm', 'a4');

    // ============= HEADER =============
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice - Order Code: ${this.order.id}`, 14, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 14, 28);

    // ============= CUSTOMER INFO =============
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 14, 40);

    const cust = this.order.user_info;

    autoTable(doc, {
      startY: 45,
      margin: { left: 14 },
      head: [['Field', 'Value']],
      body: [
        ['Name', cust?.name || '—'],
        ['Email', cust?.email || '—'],
        ['Phone', cust?.phone || '—'],
        ['Address', cust?.address || '—'],
      ],
      theme: 'grid',
    });

    // ============= CONTACT INFO =============
    let nextY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Contact Information', 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      margin: { left: 14 },
      head: [['Field', 'Value']],
      body: [
        ['Contact person', this.order.contact_name],
        ['Contact email', this.order.contact_email],
        ['Contact phone', this.order.contact_phone],
      ],
      theme: 'grid',
    });

    // ============= ORDER SUMMARY =============
    nextY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Order Summary', 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      margin: { left: 14 },
      head: [['Field', 'Value']],
      body: [
        ['Total', this.order.formattedTotal],
        ['Deposit', this.order.formattedDeposit],
        ['Remaining', this.order.formattedRemaining],
        ['Status', this.order.status],
        ['Approval status', this.order.approval_status],
        ['Refund status', this.order.refund_status],
        ['Created at', this.formatDate(this.order.created_at)],
        ['Paid at', this.formatDate(this.order.paid_at)],
        ['Cancelled at', this.formatDate(this.order.cancelled_at)],
        ['Refund time', this.formatDate(this.order.refund_time)],
      ],
      theme: 'grid',
    });

    // ============= PRODUCT TABLE =============
    nextY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.text('Products in Order', 14, nextY);

    const productRows =
      this.order.details?.map((p: any, i: number) => [
        i + 1,
        p.product_name,
        p.product_model || '',
        `${p.unit_price} USD`,
        p.quantity,
        `${p.total_price} USD`,
        p.status,
      ]) || [];

    autoTable(doc, {
      startY: nextY + 5,
      margin: { left: 14 },
      head: [['#', 'Name', 'Model', 'Price', 'Qty', 'Total', 'Status']],
      body: productRows,
      theme: 'striped',
      styles: { fontSize: 10 },
    });

    // ============= SAVE PDF =============
    doc.save(`Invoice_${this.order.id}.pdf`);
  }

  formatDate(date: any): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString('en-GB');
    } catch {
      return String(date);
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
  goBack() {
    if (this.previousUrl) {
      this.router.navigate([this.previousUrl], {
        queryParams: {
          tab: this.tabAfterBack, // ⭐ giữ tab khi quay lại
        },
      });
    } else {
      window.history.back();
    }
  }
}
