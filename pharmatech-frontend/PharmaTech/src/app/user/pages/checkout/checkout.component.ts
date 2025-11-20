// src/app/features/client/checkout/checkout.component.ts
import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
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
export class CheckoutComponent implements OnInit, AfterViewInit {
  carts: Cart[] = [];
  totalAmount = 0;

  depositSettings: DepositSetting[] = [];
  depositPercent = 0;
  depositAmount = 0;
  remainingAmount = 0;

  billingForm!: FormGroup;
  loading = true;

  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];

  defaultPercent = 10;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private cartService: CartService,
    private cartState: CartStateService,
    private depositService: DepositSettingService,
    private stripeService: StripeService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    this.initForm();
    this.loadProvinces();

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

      // 🇻🇳 Thêm 4 field địa chỉ Việt Nam
      province: ['', Validators.required],
      district: ['', Validators.required],
      ward: ['', Validators.required],
      address_detail: ['', Validators.required],

      accept_terms: [false, Validators.requiredTrue],
    });
  }

  // 🇻🇳 Load tỉnh thành
  loadProvinces() {
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data) => (this.provinces = data));
  }

  // 🇻🇳 Khi chọn tỉnh → load quận huyện
  onProvinceChange(event: any) {
    const code = event.target.value;

    this.districts = [];
    this.wards = [];

    this.billingForm.patchValue({ district: '', ward: '' });

    fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => (this.districts = data.districts));
  }

  // 🇻🇳 Khi chọn huyện → load phường xã
  onDistrictChange(event: any) {
    const code = event.target.value;

    this.wards = [];
    this.billingForm.patchValue({ ward: '' });

    fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => (this.wards = data.wards));
  }

  getProvinceName(code: string) {
    return this.provinces.find((p) => p.code == code)?.name || '';
  }

  getDistrictName(code: string) {
    return this.districts.find((d) => d.code == code)?.name || '';
  }

  private async loadDepositSettings() {
    try {
      // 1️⃣ Lấy toàn bộ range (đang active)
      const res = await this.depositService.findActive();
      this.depositSettings = res || [];

      // 2️⃣ Lấy default_percent từ BE
      try {
        const defaultRes = await this.depositService.getDefault();
        console.log('🔥 DEFAULT RES FROM BE =', defaultRes);

        // ---- CASE 1: BE trả về số thuần ----
        if (typeof defaultRes === 'number') {
          this.defaultPercent = defaultRes;
        }
        // ---- CASE 2: BE trả về object { default_percent: xx } ----
        else if (
          typeof defaultRes === 'object' &&
          defaultRes !== null &&
          'default_percent' in defaultRes
        ) {
          this.defaultPercent = Number(defaultRes.default_percent);
        }
        // ---- CASE 3: Không hợp lệ → fallback ----
        else {
          this.defaultPercent = 10;
        }
      } catch (err) {
        console.warn('⚠️ Could not load default percent, using fallback 10%');
        this.defaultPercent = 10;
      }

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
    // 🔍 Tìm mức cọc phù hợp
    const matched = this.depositSettings.find(
      (s) =>
        this.totalAmount >= s.min_total &&
        this.totalAmount <= s.max_total &&
        s.is_active
    );

    if (matched) {
      this.depositPercent = matched.percent;
    } else {
      // 🟢 Nếu không có cấu hình phù hợp → dùng defaultPercent của admin
      this.depositPercent = this.defaultPercent;
      console.warn(
        `⚠️ No deposit setting matched. Using default ${this.defaultPercent}%.`
      );
    }

    // Tính toán
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
      // 🇻🇳 Build full Vietnam Address
      const f = this.billingForm.value;

      const fullAddress =
        `${f.address_detail}, ${f.ward}, ` +
        `${this.getDistrictName(f.district)}, ` +
        `${this.getProvinceName(f.province)}`;

      const billing_info = {
        name: f.name,
        email: f.email,
        phone: f.phone,
        address: fullAddress,
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

  ngAfterViewInit() {
    // --- CSS ---
    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];
    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
    const jsFiles = [
      'assets/js/vendor/modernizr-3.11.7.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
