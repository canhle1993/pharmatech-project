import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { env } from '../enviroments/enviroment';
import { Order } from '../entities/order.entity';
import { OrderDetails } from '../entities/order-details.entity';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private baseUrl = env.baseUrl + 'order/';
  private detailUrl = env.baseUrl + 'order-details/';

  constructor(private httpClient: HttpClient) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy toàn bộ đơn hàng (admin dùng) */
  async findAll(): Promise<Order[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<Order[]>(this.baseUrl + 'find-all')
      );

      return res.map((r) => {
        const order = Object.assign(new Order(), r);
        // ✅ Fix an toàn nhất để safeId luôn có giá trị
        order.id = (r as any)._id || (r as any).id || '';
        return order;
      });
    } catch (error) {
      console.error('❌ findAll error:', error);
      return [];
    }
  }

  /** 🔹 Lấy đơn hàng theo ID */
  async findById(id: string): Promise<Order | null> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<Order>(this.baseUrl + 'find-by-id/' + id)
      );
      return Object.assign(new Order(), res);
    } catch (error) {
      console.error('❌ findById error:', error);
      return null;
    }
  }

  /** 🔹 Lấy chi tiết sản phẩm của 1 đơn hàng */
  async findDetailsByOrder(orderId: string): Promise<OrderDetails[]> {
    try {
      const res = await lastValueFrom(
        this.httpClient.get<OrderDetails[]>(
          this.detailUrl + 'find-by-order/' + orderId
        )
      );
      return res.map((r) => Object.assign(new OrderDetails(), r));
    } catch (error) {
      console.error('❌ findDetailsByOrder error:', error);
      return [];
    }
  }

  // ==================================================
  // 📤 UPLOAD BIÊN LAI THANH TOÁN
  // ==================================================

  /** ✅ Upload ảnh biên lai (payment proof) */
  async uploadProof(orderId: string, file: File): Promise<Order | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await lastValueFrom(
        this.httpClient.post<any>(
          this.baseUrl + 'upload-proof/' + orderId,
          formData
        )
      );

      return Object.assign(new Order(), res.data);
    } catch (error) {
      console.error('❌ uploadProof error:', error);
      return null;
    }
  }

  // ==================================================
  // 🔄 CẬP NHẬT TRẠNG THÁI / PHÊ DUYỆT
  // ==================================================

  /** ✅ Cập nhật trạng thái phê duyệt (Approved / Rejected) */
  async updateApproval(
    id: string,
    approval_status: string,
    updated_by: string
  ): Promise<{ msg: string }> {
    try {
      const body = { approval_status, updated_by };
      return await lastValueFrom(
        this.httpClient.put<{ msg: string }>(
          this.baseUrl + 'update-approval/' + id,
          body
        )
      );
    } catch (error) {
      console.error('❌ updateApproval error:', error);
      throw error;
    }
  }

  async getGroupedOrders(): Promise<{
    pending: Order[];
    approved: Order[];
    rejected: Order[];
  }> {
    const all = await this.findAll();
    return {
      pending: all.filter((o) => o.approval_status === 'Pending Approval'),
      approved: all.filter((o) => o.approval_status === 'Approved'),
      rejected: all.filter((o) => o.approval_status === 'Rejected'),
    };
  }

  // ==================================================
  // ❌ HUỶ ĐƠN (CANCEL ORDER)
  // ==================================================
  async cancelOrder(id: string, cancelled_by: string): Promise<any> {
    try {
      const res = await lastValueFrom(
        this.httpClient.put(this.baseUrl + 'cancel/' + id, { cancelled_by })
      );
      return res;
    } catch (error) {
      console.error('❌ cancelOrder error:', error);
      throw error;
    }
  }

  /** 🗑️ Xóa mềm đơn hàng */
  async softDelete(id: string, updated_by: string): Promise<{ msg: string }> {
    try {
      const body = { updated_by };
      return await lastValueFrom(
        this.httpClient.put<{ msg: string }>(
          this.baseUrl + 'soft-delete/' + id,
          body
        )
      );
    } catch (error) {
      console.error('❌ softDelete error:', error);
      throw error;
    }
  }

  // ==================================================
  // 💳 TẠO ĐƠN HÀNG SAU THANH TOÁN STRIPE
  // ==================================================

  // ==================================================
  // 📌 TẠO ĐƠN HÀNG SAU THANH TOÁN STRIPE
  // ==================================================
  async createAfterPayment(payload: {
    user_id: string;
    carts: any[];
    billing_info: any;
    total_amount: number;
    deposit_amount: number;
  }): Promise<any> {
    return await lastValueFrom(
      this.httpClient.post(this.baseUrl + 'create-after-payment', payload)
    );
  }

  // ==================================================
  // 📌 TRỪ STOCK SẢN PHẨM
  // ==================================================
  async reduceStock(productId: string, quantity: number): Promise<any> {
    return await lastValueFrom(
      this.httpClient.put(env.baseUrl + 'product/reduce-stock/' + productId, {
        quantity,
      })
    );
  }

  /** ✅ Cập nhật trạng thái tổng thể (Approved Tab) */
  async updateStatus(
    id: string,
    status: string,
    updated_by: string
  ): Promise<{ msg: string; detail?: string }> {
    // 👈 thêm detail? ở đây
    try {
      const body = { status, updated_by };
      return await lastValueFrom(
        this.httpClient.put<{ msg: string; detail?: string }>(
          this.baseUrl + 'update-status/' + id,
          body
        )
      );
    } catch (error) {
      console.error('❌ updateStatus error:', error);
      throw error;
    }
  }

  async updatePaymentInfo(
    id: string,
    payload: {
      remaining_payment_method: string;
      remaining_payment_note: string;
      payment_proof_url: string;
      updated_by: string;
    }
  ): Promise<{ msg: string }> {
    try {
      return await lastValueFrom(
        this.httpClient.put<{ msg: string }>(
          this.baseUrl + 'update-payment-info/' + id,
          payload
        )
      );
    } catch (error) {
      console.error('❌ updatePaymentInfo error:', error);
      throw error;
    }
  }
  async uploadProofTemp(formData: FormData): Promise<any> {
    try {
      return await lastValueFrom(
        this.httpClient.post<any>(this.baseUrl + 'upload-proof-temp', formData)
      );
    } catch (err) {
      console.error('uploadProof error:', err);
      throw err;
    }
  }

  async markCompleted(id: string, updated_by: string): Promise<any> {
    try {
      return await lastValueFrom(
        this.httpClient.put<any>(this.baseUrl + 'mark-completed/' + id, {
          updated_by,
        })
      );
    } catch (err) {
      console.error('markCompleted error:', err);
      throw err;
    }
  }

  /** 🚫 Reject Order (Pending Approval hoặc Approved) */
  async rejectOrder(
    id: string,
    payload: {
      cancel_reason: string;
      payment_proof_url?: string; // Chỉ có ở case Pending Approval
      updated_by: string;
    }
  ): Promise<{ msg: string; approval_status: string; refund_status: string }> {
    try {
      return await lastValueFrom(
        this.httpClient.put<{
          msg: string;
          approval_status: string;
          refund_status: string;
        }>(this.baseUrl + 'reject/' + id, payload)
      );
    } catch (error) {
      console.error('❌ rejectOrder error:', error);
      throw error;
    }
  }

  getPendingCount() {
    return this.httpClient.get<{ count: number }>(
      this.baseUrl + 'pending-count'
    );
  }
}
