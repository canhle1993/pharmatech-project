import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    DialogModule,
    InputOtpModule,
    InputTextModule,
    ButtonModule,
    RouterLink,
    PasswordModule,
    DividerModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class RegisterComponent {
  registerForm!: FormGroup;
  visible = false;
  otp = '';
  msg = '';
  suggestions: string[] = [];
  usernameStatus: string = '';
  showOtpButton = false;
  showPassword = false;

  countdown: number = 300; // 5 phút = 300 giây
  countdownText: string = '05:00';
  timer: any = null;
  otpExpired = false;
  otpExpiredAt!: Date;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[A-Za-zÀ-Ỹà-ỹĂăÂâĐđÊêÔôƠơƯư\s]+$/),
          ],
        ],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(54),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(64),
            Validators.pattern(
              /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }
  ngOnInit() {
    // Lắng nghe thay đổi của name
    this.registerForm.get('name')?.valueChanges.subscribe((val) => {
      if (val && val.trim() !== '') {
        this.generateUsernameSuggestions(val);
      } else {
        this.suggestions = []; // xóa khi rỗng
      }
    });

    // 🔹 Lắng nghe khi người dùng nhập Username
    this.registerForm.get('username')?.valueChanges.subscribe(async (val) => {
      if (!val || val.trim() === '') {
        this.usernameStatus = '';
        return;
      }

      try {
        const res = await this.accountService.checkUsername(val.trim());
        this.usernameStatus = res.exists
          ? '❌ Username already taken'
          : '✅ Username available';
      } catch (err) {
        this.usernameStatus = '';
      }
    });
  }

  startCountdown() {
    if (!this.otpExpiredAt) return;

    this.otpExpired = false;

    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      const now = Date.now();
      const exp = new Date(this.otpExpiredAt).getTime();
      const diff = exp - now;

      if (diff <= 0) {
        clearInterval(this.timer);
        this.countdownText = '00:00';
        this.otpExpired = true;
        this.visible = false;

        this.messageService.add({
          severity: 'warn',
          summary: 'OTP Expired',
          detail: 'Your OTP has expired. Please request a new one.',
        });

        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      this.countdownText = `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }, 1000);
  }

  updateCountdownText() {
    const m = Math.floor(this.countdown / 60);
    const s = this.countdown % 60;
    this.countdownText = `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  }

  onInputFocus(e: FocusEvent) {
    const group = (e.target as HTMLElement).closest(
      '.neu-input'
    ) as HTMLElement;
    if (group) group.style.transform = 'scale(0.98)';
  }

  onInputBlur(e: FocusEvent) {
    const group = (e.target as HTMLElement).closest(
      '.neu-input'
    ) as HTMLElement;
    if (group) group.style.transform = 'scale(1)';
  }

  generateUsernameSuggestions(name: string) {
    // Chuyển tên sang không dấu, viết liền, chữ thường
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();

    // Sinh 2 số ngẫu nhiên không trùng nhau
    const random1 = Math.floor(1000 + Math.random() * 9000);
    let random2;
    do {
      random2 = Math.floor(1000 + Math.random() * 9000);
    } while (random1 === random2);

    this.suggestions = [`${base}${random1}`, `${base}${random2}`];
  }

  /** 🔹 Khi người dùng chọn gợi ý */
  selectSuggestion(s: string) {
    this.registerForm.patchValue({ username: s });
    this.suggestions = []; // ẩn gợi ý
  }
  /** 🔹 Kiểm tra xác nhận mật khẩu */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password && confirm && password !== confirm
      ? { mismatch: true }
      : null;
  }

  /** 🔹 Đăng ký tài khoản */
  async save() {
    if (this.registerForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Form',
        detail: 'Please fill all fields correctly.',
      });
      return;
    }

    try {
      const res: any = await this.accountService.create(
        this.registerForm.value
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: res.msg || 'Account created, please verify OTP',
      });

      this.otpExpiredAt = new Date(res.otpExpiredAt);
      this.visible = true;
      this.showOtpButton = true;
      this.startCountdown();
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.msg || 'Registration failed',
      });
    }
  }

  /** 🔹 Xác thực OTP */
  async verify() {
    try {
      const email = this.registerForm.value.email;
      const res: any = await this.accountService.verify(email, this.otp);

      this.messageService.add({
        severity: 'success',
        summary: 'Verified',
        detail: 'Verification successful, please log in',
      });

      this.visible = false;
      this.showOtpButton = false;
      setTimeout(() => this.router.navigate(['/auth/login']), 1500);
    } catch (err: any) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid OTP',
        detail: err.error?.msg || 'Invalid OTP, please try again',
      });
    }
  }
}
