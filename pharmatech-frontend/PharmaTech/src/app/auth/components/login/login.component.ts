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
    this.touchField('username');
    this.touchField('password');

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields.',
      });
      return;
    }

    this.setLoading(true);

    try {
      const { username, password, remember } = this.loginForm.value;

      // 1️⃣ Gọi login -> lấy token + rawAccount
      const res: any = await this.accountService.login(username, password);
      if (!res?.access_token) {
        this.messageService.add({
          severity: 'error',
          summary: 'Login Error',
          detail: res?.msg || 'Invalid credentials',
        });
        return;
      }

      const raw = res.account;

      // 2️⃣ Chuẩn hóa userId từ raw
      const userId = raw._id || raw.id;
      if (!userId) throw new Error('❌ Login error: account missing _id');

      // 3️⃣ Gọi lại findById để lấy DTO có photo đúng URL
      const dto = await this.accountService.findById(userId);

      // 4️⃣ Chuẩn hóa DTO → đảm bảo có id và _id để FE nào cũng dùng được
      const normalized = {
        ...dto,
        id: dto.id || userId,
        _id: dto.id || userId,
      };

      // 5️⃣ Lưu vào localStorage
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      localStorage.setItem('userId', normalized.id);
      localStorage.setItem('access_token', res.access_token);

      // 6️⃣ Remember me
      if (remember) {
        localStorage.setItem('remember_me', '1');
        localStorage.setItem('remember_user', username);
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('remember_user');
      }

      // 7️⃣ Toast
      this.messageService.add({
        severity: 'success',
        summary: 'Login successful',
        detail: `Welcome, ${normalized.name}`,
      });

      // 8️⃣ Điều hướng theo role
      const role = normalized.roles?.[0]?.toLowerCase() || 'user';

      setTimeout(() => {
        if (role === 'admin' || role === 'superadmin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      }, 800);
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
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(v: boolean) {
    this.loading = v;
    // disable/enable button is handled by template [disabled]
  }
}
