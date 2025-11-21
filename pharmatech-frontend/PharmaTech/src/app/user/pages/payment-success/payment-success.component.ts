import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../../services/order.service';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service'; // nếu bạn có service trừ stock
import { CartStateService } from '../../../services/cart-state.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, ToastModule],
  template: `
    <p-toast></p-toast>

    <div class="success-wrapper">
      <div class="success-card">
        <div class="spinner"></div>
        <h2>Processing your order...</h2>
        <p>Please wait a moment.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .success-wrapper {
        height: 80vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f8f9fa;
      }

      .success-card {
        text-align: center;
        padding: 40px 60px;
        border-radius: 16px;
        background: white;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        animation: fadeUp 0.4s ease-out;
      }

      .success-card h2 {
        margin: 20px 0 10px;
        font-weight: 600;
        color: #333;
      }

      .success-card p {
        color: #666;
        font-size: 15px;
      }

      .spinner {
        width: 55px;
        height: 55px;
        border: 5px solid #ddd;
        border-top-color: #4caf50;
        border-radius: 50%;
        margin: 0 auto;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  providers: [MessageService],
})
export class PaymentSuccessComponent implements OnInit {
  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private cartStateService: CartStateService,
    private router: Router,
    private messageService: MessageService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    try {
      const userId = localStorage.getItem('userId');
      const billing_info = JSON.parse(
        localStorage.getItem('billing_info') || '{}'
      );
      const carts = JSON.parse(localStorage.getItem('checkout_carts') || '[]');
      const totalAmount = Number(localStorage.getItem('checkout_total'));
      const depositAmount = Number(localStorage.getItem('checkout_deposit'));

      if (!userId || !carts.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'Order Failed',
          detail: 'Invalid session or empty cart.',
        });
        return;
      }

      // 1️⃣ Gửi API tạo Order
      const order = await this.orderService.createAfterPayment({
        user_id: userId,
        carts,
        billing_info,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
      });

      // 2️⃣ Xóa cart trong DB

      // 3️⃣ Trừ stock_quantity của product
      for (const c of carts) {
        const productId =
          typeof c.product_id === 'string' ? c.product_id : c.product_id._id;

        await this.productService.reduceStock(productId, c.quantity);
      }

      // 4️⃣ Xóa localStorage checkout
      localStorage.removeItem('checkout_carts');
      localStorage.removeItem('checkout_total');
      localStorage.removeItem('checkout_deposit');
      localStorage.removeItem('billing_info');

      // 5️⃣ Hiện thông báo thành công
      this.messageService.add({
        severity: 'success',
        summary: 'Order Successful',
        detail: 'Your order has been placed successfully.',
      });

      // 6️⃣ Redirect về Profile sau 1.2s
      setTimeout(() => {
        this.router.navigate([`/profile/${userId}`], {
          queryParams: {
            orderSuccess: '1',
            openTab: 'orders', // ⭐ Mở tab Orders
          },
        });
      }, 1200);
    } catch (error) {
      console.error('❌ PaymentSuccess Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Order Failed',
        detail: 'Payment succeeded but could not create order.',
      });
    }
  }
}
