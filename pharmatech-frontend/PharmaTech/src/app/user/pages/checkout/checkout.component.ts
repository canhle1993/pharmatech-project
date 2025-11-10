// src/app/features/client/checkout/checkout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { Cart } from '../../../entities/cart.entity';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { DepositSettingService } from '../../../services/deposit-setting.service';
import { DepositSetting } from '../../../entities/deposit-setting.entity';

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
})
export class CheckoutComponent implements OnInit {
  carts: Cart[] = [];
  totalAmount = 0;

  depositSettings: DepositSetting[] = [];
  depositPercent = 0;
  depositAmount = 0;
  remainingAmount = 0;

  billingForm!: FormGroup;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private cartService: CartService,
    private cartState: CartStateService,
    private depositService: DepositSettingService
  ) {}

  async ngOnInit() {
    this.initForm();

    // ✅ Lấy dữ liệu từ CartState trước
    const stateData = this.cartState.getCheckoutData();
    if (stateData?.carts?.length) {
      this.carts = stateData.carts;
      this.totalAmount = stateData.totalAmount;
    } else {
      // 🔁 Fallback nếu user F5/truy cập trực tiếp: nạp lại từ backend
      const userId = localStorage.getItem('userId') || '';
      if (!userId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Please login',
          detail: 'You must be logged in to checkout.',
        });
        this.loading = false;
        return;
      }
      this.carts = await this.cartService.findByUser(userId);
      this.totalAmount = this.cartService.calcTotal(this.carts);
    }

    await this.loadDepositSettings();
  }

  private initForm() {
    this.billingForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: ['', Validators.required],
      accept_terms: [false, Validators.requiredTrue],
    });
  }

  private async loadDepositSettings() {
    try {
      const res = await this.depositService.findActive();
      this.depositSettings = res || [];
      this.calcDeposit();
    } catch (err) {
      console.error('❌ loadDepositSettings error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not load deposit settings.',
      });
    } finally {
      this.loading = false;
    }
  }

  private calcDeposit() {
    // 🔹 Ghi log để kiểm tra
    console.log('💰 Total amount:', this.totalAmount);
    console.log('📊 Deposit settings:', this.depositSettings);

    // 🔹 Tìm mức cọc phù hợp trong danh sách
    const matched = this.depositSettings.find(
      (s) =>
        this.totalAmount >= s.min_total &&
        this.totalAmount <= s.max_total &&
        s.is_active
    );

    // 🔹 Nếu có match → dùng cấu hình admin
    if (matched) {
      this.depositPercent = matched.percent;
      console.log('✅ Matched deposit setting:', matched);
    } else {
      // 🔹 Nếu không có cấu hình phù hợp → mặc định 10%
      this.depositPercent = 10;
      console.warn(
        '⚠️ No deposit setting matched total amount. Using default 10%.'
      );
    }

    // 🔹 Tính toán lại
    this.depositAmount = Math.round(
      (this.totalAmount * this.depositPercent) / 100
    );
    this.remainingAmount = this.totalAmount - this.depositAmount;
  }

  async placeOrder() {
    if (this.billingForm.invalid) {
      this.billingForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required billing fields and accept terms.',
      });
      return;
    }

    // ⚙️ TODO: gọi API tạo Order ở bước sau
    const payload = {
      customer: this.billingForm.value,
      carts: this.carts.map((c) => ({
        cart_id: c._id || c.id,
        product_id:
          typeof c.product_id === 'object' ? c.product_id._id : c.product_id,
        product_name: c.productName,
        quantity: c.quantity,
        price: c.price,
        subtotal: c.total_price,
      })),
      total_amount: this.totalAmount,
      deposit_percent: this.depositPercent,
      deposit_amount: this.depositAmount,
      remaining_amount: this.remainingAmount,
      payment_method: 'paypal',
    };

    console.log('📦 Order payload:', payload);
    this.messageService.add({
      severity: 'success',
      summary: 'Order Ready',
      detail: `Deposit ${
        this.depositPercent
      }% = ${this.depositAmount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}`,
    });
  }
}
