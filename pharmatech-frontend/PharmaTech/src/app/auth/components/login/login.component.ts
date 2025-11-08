import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ToastModule,
  ],
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  success = false;

  usernameError = '';
  passwordError = '';

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]], // email hoặc username
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });
  }
  ngOnInit(): void {
    this.autoReloadOnce();

    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false],
    });
  }

  private autoReloadOnce(): void {
    const reloaded = sessionStorage.getItem('login-page-reloaded');
    if (!reloaded) {
      sessionStorage.setItem('login-page-reloaded', 'true');
      console.log('🔄 Reloading login page once...');
      window.location.reload();
    } else {
      sessionStorage.removeItem('login-page-reloaded');
    }
  }

  // ===== UI helpers =====
  togglePassword() {
    this.showPassword = !this.showPassword;
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
    // cập nhật lỗi tức thời
    this.touchField(
      (e.target as HTMLInputElement).id === 'password' ? 'password' : 'username'
    );
  }

  onSocial(provider: 'google' | 'github' | 'twitter', ev: Event) {
    const btn = ev.currentTarget as HTMLElement;
    // soft press animation
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => (btn.style.transform = 'scale(1)'), 150);

    this.messageService.add({
      severity: 'info',
      summary: 'Social login',
      detail: `Redirecting to ${provider}... (UI only)`,
    });
    // TODO: tích hợp OAuth thật nếu cần
  }

  // ===== Validation helpers =====
  isInvalid(controlName: 'username' | 'password'): boolean {
    const c = this.loginForm.get(controlName);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  private touchField(controlName: 'username' | 'password') {
    const c = this.loginForm.get(controlName);
    if (!c) return;
    c.markAsTouched();

    if (controlName === 'username') {
      this.usernameError = c.hasError('required')
        ? 'Email/Username is required'
        : '';
    }
    if (controlName === 'password') {
      this.passwordError = c.hasError('required')
        ? 'Password is required'
        : c.hasError('minlength')
        ? 'Password must be at least 6 characters'
        : '';
    }
  }

  // ===== Submit =====
  async login() {
    // chạm hết field để hiện lỗi
    this.touchField('username');
    this.touchField('password');

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields correctly.',
      });
      return;
    }

    this.setLoading(true);

    try {
      const { username, password, remember } = this.loginForm.value;

      const res: any = await this.accountService.login(username, password);

      if (res?.account) {
        // Lưu token (tuỳ API của bạn)
        localStorage.setItem(
          'token',
          res.token || res.account.email || username
        );
        // ✅ Lưu ID người dùng để giỏ hàng có thể dùng
        if (res.account._id) {
          localStorage.setItem('userId', res.account._id);
        }

        // Ghi nhớ nếu cần
        if (remember) {
          localStorage.setItem('remember_me', '1');
          localStorage.setItem('remember_user', username);
        } else {
          localStorage.removeItem('remember_me');
          localStorage.removeItem('remember_user');
        }

        const role = res.account.roles?.[0]?.toLowerCase() || 'user';

        this.messageService.add({
          severity: 'success',
          summary: 'Login successful',
          detail: `Welcome, ${username}`,
        });

        // Hiệu ứng success mềm
        this.success = true;

        setTimeout(() => {
          if (role === 'admin' || role === 'superadmin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        }, 900);
      } else {
        const msg = res?.msg || 'Invalid credentials';
        this.messageService.add({
          severity: 'error',
          summary: 'Login Error',
          detail: msg,
        });
        this.passwordError = msg;
        this.loginForm.get('password')?.markAsTouched();
      }
    } catch (err: any) {
      const detailMsg =
        err?.error?.message ||
        err?.error?.msg ||
        err?.message ||
        'Login failed. Please try again.';
      this.messageService.add({
        severity: 'error',
        summary: 'Login Error',
        detail: detailMsg,
      });
      this.passwordError = detailMsg;
      this.loginForm.get('password')?.markAsTouched();
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(v: boolean) {
    this.loading = v;
    // disable/enable button is handled by template [disabled]
  }
}
