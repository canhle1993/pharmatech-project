import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { DialogModule } from 'primeng/dialog';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgotPassword.component.html',
  styleUrls: ['./forgotPassword.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    InputOtpModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    RouterLink,
    PasswordModule,
    DividerModule,
  ],
  providers: [MessageService],
})
export class ForgotPasswordComponent {
  form!: FormGroup;
  resetForm!: FormGroup;
  otp = '';

  visibleOtp = false;
  visibleReset = false;
  msg = '';
  otpSent = false;

  countdown = 300;
  countdownText = '05:00';
  timer: any = null;
  otpExpired = false;

  emailForOtp = '';
  step: 'email' | 'otp' | 'reset' = 'email';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private accountService: AccountService,
    private messageService: MessageService
  ) {
    // 🔹 Form nhập email
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    // 🔹 Form đặt lại mật khẩu
    this.resetForm = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
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

  /** ✅ Kiểm tra mật khẩu khớp */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password && confirm && password !== confirm
      ? { mismatch: true }
      : null;
  }

  // =========================
  // SEND OTP
  // =========================
  async sendOtp() {
    if (this.form.invalid) return;

    const email = this.form.value.email;
    this.emailForOtp = email;

    try {
      const res: any = await this.accountService.sendOtp(email);

      this.messageService.add({
        severity: 'success',
        summary: 'OTP sent',
        detail: res.msg,
      });

      this.otpSent = true;
      this.visibleOtp = true;

      this.startCountdown();
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.msg || 'Failed to send OTP',
      });
    }
  }

  // =========================
  // VERIFY OTP
  // =========================
  async verifyOtp() {
    try {
      const res = await this.accountService.verifyOtp(
        this.emailForOtp,
        this.otp
      );

      this.messageService.add({
        severity: 'success',
        summary: 'OTP verified',
        detail: 'Please reset your password now',
      });

      this.visibleOtp = false;
      this.visibleReset = true;

      // stop countdown
      clearInterval(this.timer);
      this.timer = null;
    } catch (err: any) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid OTP',
        detail: err.error?.msg || 'Wrong OTP',
      });
    }
  }

  // =========================
  // RESET PASSWORD
  // =========================
  async resetPassword() {
    if (this.resetForm.invalid) return;

    try {
      await this.accountService.resetPassword(
        this.emailForOtp,
        this.resetForm.value.newPassword
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password reset successfully',
      });

      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 1500);
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.msg || 'Reset failed',
      });
    }
  }

  // =========================
  // COUNTDOWN
  // =========================
  startCountdown() {
    // Nếu timer đang chạy → không tạo timer mới
    if (this.timer) return;

    this.countdown = 300;
    this.otpExpired = false;
    this.updateCountdownText();

    this.timer = setInterval(() => {
      this.countdown--;
      this.updateCountdownText();

      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.timer = null;

        this.otpExpired = true;
        this.visibleOtp = false;

        this.messageService.add({
          severity: 'warn',
          summary: 'Expired',
          detail: 'OTP expired. Please request a new one.',
        });
      }
    }, 1000);
  }

  updateCountdownText() {
    const m = Math.floor(this.countdown / 60);
    const s = this.countdown % 60;
    this.countdownText = `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  }
}
