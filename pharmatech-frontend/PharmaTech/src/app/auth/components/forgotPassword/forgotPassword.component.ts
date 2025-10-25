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

  /** 🔹 Gửi yêu cầu quên mật khẩu */
  async sendOtp() {
    if (this.form.invalid) {
      this.msg = 'Please enter a valid email';
      return;
    }

    try {
      const email = this.form.value.email;
      const res: any = await this.accountService.sendOtp(email);
      this.messageService.add({
        severity: 'success',
        summary: 'OTP Sent',
        detail: res.msg || 'Please check your email for OTP',
      });
      this.visibleOtp = true;
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.msg || 'Failed to send OTP',
      });
    }
  }

  /** 🔹 Xác minh OTP */
  async verifyOtp() {
    const email = this.form.value.email;
    if (!this.otp || this.otp.length !== 4) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid OTP',
        detail: 'Please enter a valid 4-digit code',
      });
      return;
    }

    try {
      const res: any = await this.accountService.verifyOtp(email, this.otp);
      this.messageService.add({
        severity: 'success',
        summary: 'OTP Verified',
        detail: res.msg || 'Enter your new password',
      });
      this.visibleOtp = false;
      this.visibleReset = true;
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Verification failed',
        detail: err.error?.msg || 'Invalid or expired OTP',
      });
    }
  }

  /** 🔹 Đặt lại mật khẩu */
  async resetPassword() {
    if (this.resetForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid password',
        detail: 'Please fill password fields correctly',
      });
      return;
    }

    const email = this.form.value.email;
    const newPassword = this.resetForm.value.newPassword;

    try {
      const res: any = await this.accountService.resetPassword(
        email,
        newPassword
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Password reset',
        detail: res.msg || 'You can now login with your new password',
      });
      this.visibleReset = false;
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed',
        detail: err.error?.msg || 'Reset failed',
      });
    }
  }
}
