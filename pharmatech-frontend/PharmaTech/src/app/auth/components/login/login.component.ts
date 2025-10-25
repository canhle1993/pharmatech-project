import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
    InputTextModule,
    ButtonModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class LoginComponent {
  loginForm!: FormGroup;
  msg = '';
  visible = false;
  position = '';

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  onHover() {
    const uname = this.loginForm.get('username')?.value?.trim();
    const pass = this.loginForm.get('password')?.value?.trim();

    // Nếu chưa nhập đầy đủ => nút nhảy
    if (!uname || !pass) {
      const positions = ['shift-left', 'shift-right', 'shift-up', 'shift-down'];
      const next = positions[Math.floor(Math.random() * positions.length)];
      this.position = next;
    } else {
      this.position = ''; // Nhập đủ => nút đứng yên
    }
  }

  async login() {
    if (this.loginForm.invalid) {
      this.msg = 'Please enter username and password';
      return;
    }

    try {
      const { username, password } = this.loginForm.value;
      const res: any = await this.accountService.login(username, password);

      if (res?.account) {
        // Lấy phần tử đầu tiên trong mảng roles (vì là mảng chuỗi)
        const role = res.account.roles?.[0]?.toLowerCase() || 'user';

        this.messageService.add({
          severity: 'success',
          summary: 'Login successful',
          detail: `Welcome, ${username}`,
        });

        setTimeout(() => {
          if (role === 'admin' || role === 'superadmin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/user']);
          }
        }, 1000);
      } else {
        this.msg = res?.msg || 'Invalid credentials';
      }
    } catch (err: any) {
      // Lấy thông báo lỗi từ backend (ưu tiên err.error.message, sau đó tới err.error.msg)
      const detailMsg =
        err.error?.message ||
        err.error?.msg ||
        err.message ||
        'Login failed. Please check your credentials.';

      // Hiển thị trên giao diện
      this.msg = detailMsg;

      // Hiển thị Toast đẹp
      this.messageService.add({
        severity: 'error',
        summary: 'Login Error',
        detail: detailMsg,
      });
    }
  }
}
