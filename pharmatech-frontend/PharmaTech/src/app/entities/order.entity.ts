import { OrderDetails } from './order-details.entity';

export class Order {
  /** 🆔 ID */
  id?: string;
  _id?: string;

  /** 👤 Người đặt hàng */
  user_info?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  contact_name!: string;
  contact_email!: string;
  contact_phone!: string;
  contact_address!: string;

  /** 💰 Thông tin thanh toán */
  total_amount!: number;
  deposit_percent!: number;
  deposit_amount!: number;
  remaining_payment_amount!: number;

  /** 💳 Hình thức thanh toán */
  payment_method?: string;
  paypal_order_id?: string;
  payment_id?: string;
  refund_id?: string;

  /** 📦 Trạng thái đơn hàng */
  status!: string; // Pending, Deposit Paid, Paid in Full, Cancelled, Refunded, Completed
  approval_status!: string; // Pending Approval, Approved, Rejected
  refund_status!: string; // None, Deposit Lost, Deposit Refunded

  /** 🕓 Mốc thời gian */
  created_at?: string | Date;
  updated_at?: string | Date;
  paid_at?: string | Date;
  cancelled_at?: string | Date;
  refund_time?: string | Date;

  /** 📎 Khác */
  remaining_payment_note?: string;
  remaining_payment_method?: string;
  payment_proof_url?: string;
  cancel_reason?: string;

  /** 🧾 Danh sách sản phẩm cũ (nếu có dùng items ở phần khác) */
  items?: OrderDetails[];

  /** 🆕 Danh sách sản phẩm thực tế từ API /find-by-id */
  details?: OrderDetails[];

  /** ⚙️ Trạng thái hệ thống */
  is_active?: boolean;
  is_delete?: boolean;
  updated_by?: string;

  /** 💡 Getter hiển thị UI */
  get formattedTotal(): string {
    return (this.total_amount ?? 0).toLocaleString('en-US') + ' USD';
  }

  get formattedDeposit(): string {
    return `${this.deposit_amount.toLocaleString('en-US')} USD (${
      this.deposit_percent
    }%)`;
  }
  get approvalLabel(): string {
    return this.approval_status || 'N/A';
  }

  get formattedRemaining(): string {
    return this.remaining_payment_amount
      ? this.remaining_payment_amount.toLocaleString('en-US') + ' USD'
      : '0 USD';
  }

  /** 🏷️ Trạng thái đơn hàng (màu tag) */
  get statusBadge():
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast' {
    switch (this.status) {
      case 'Completed':
      case 'Paid in Full':
        return 'success';
      case 'Deposit Paid':
        return 'info';
      case 'Pending':
        return 'warn';
      case 'Cancelled':
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  get approvalBadge():
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast' {
    switch (this.approval_status) {
      case 'Approved':
        return 'success';
      case 'Pending Approval':
        return 'warn'; // ✅ PrimeNG dùng 'warn' chứ không phải 'warning'
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  get safeId(): string {
    return this.id || this._id || '';
  }
}
