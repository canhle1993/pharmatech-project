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
import { StripeService } from '../../../services/stripe.service';

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
    private depositService: DepositSettingService,
    private stripeService: StripeService
  ) {}

  async ngOnInit() {
    this.initForm();

    // 🔥 Lấy userId chuẩn
    const userId = localStorage.getItem('userId');

    if (!userId || userId.length !== 24) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must be logged in to checkout.',
      });
      this.loading = false;
      return;
    }

    // ✅ Nếu có state cart
    const stateData = this.cartState.getCheckoutData();
    if (stateData?.carts?.length) {
      this.carts = stateData.carts;
      this.totalAmount = stateData.totalAmount;
    } else {
      // 🔁 Load lại từ backend
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

    try {
      const userId = localStorage.getItem('userId');

      if (!userId || userId.length !== 24) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Login Required',
          detail: 'Please login to continue.',
        });
        return;
      }

      // 1️⃣ Save Billing
      const billing_info = {
        name: this.billingForm.value.name,
        email: this.billingForm.value.email,
        phone: this.billingForm.value.phone,
        address: this.billingForm.value.address,
      };
      localStorage.setItem('billing_info', JSON.stringify(billing_info));

      // 2️⃣ Save checkout data
      localStorage.setItem('checkout_carts', JSON.stringify(this.carts));
      localStorage.setItem('checkout_total', String(this.totalAmount));
      localStorage.setItem('checkout_deposit', String(this.depositAmount));

      // 3️⃣ Stripe
      const stripeItems = [
        {
          product_name: 'Deposit Payment',
          unit_price: this.depositAmount,
          quantity: 1,
          description: `Deposit ${this.depositPercent}% of total ${this.totalAmount} USD`,
        },
      ];

      const res = await this.stripeService.createCheckoutSession({
        user_id: userId,
        items: stripeItems,
        billing_info,
      });

      if (res?.url) {
        this.messageService.add({
          severity: 'info',
          summary: 'Redirecting...',
          detail: `Redirecting to Stripe for ${this.depositPercent}% deposit.`,
        });
        setTimeout(() => (window.location.href = res.url), 900);
      } else {
        throw new Error('Stripe URL not returned');
      }
    } catch (err: any) {
      console.error('❌ Stripe checkout error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Payment Failed',
        detail: err?.message || 'Could not create Stripe session.',
      });
    }
  }
}
