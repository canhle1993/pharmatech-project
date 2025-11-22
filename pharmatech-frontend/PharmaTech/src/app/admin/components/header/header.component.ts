// header.component.ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  user: any = null;
  currentTime = new Date();
  notifications: any[] = [];
  messages: any[] = [];

  constructor(
    private accountService: AccountService,
    private userState: UserStateService,
    private router: Router,
    private notifyService: NotificationService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    // 🔔 Lắng nghe notification realtime
    this.notifyService.notifications$.subscribe((list) => {
      this.notifications = list;
    });

    // 💬 Lắng nghe messages realtime
    this.notifyService.messages$.subscribe((list) => {
      this.messages = list;
    });

    // 🕐 Cập nhật thời gian realtime
    setInterval(() => (this.currentTime = new Date()), 1000);

    // =====================================================
    // 🔥 NEW — GẮN USER REALTIME
    // =====================================================

    // 1) Load từ localStorage lúc vào trang
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      // cập nhật vào UserStateService để broadcast
      this.userState.setUser(JSON.parse(storedUser));
    }

    // 2) Nghe user cập nhật realtime (update profile)
    this.userState.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        console.log('🔄 Header updated:', user);
      }
    });

    console.log('👤 Header initial user:', this.user);
  }

  logout() {
    // ❗ Xóa token + thông tin user khỏi localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    // Nếu bạn có lưu role, permission, cart... thì xoá luôn:
    // localStorage.removeItem('role');
    // localStorage.removeItem('cart');

    // ❗ Gọi service logout nếu backend có xử lý
    this.accountService.logout();

    // ❗ Điều hướng về trang login
    this.router.navigate(['/auth/login']);
  }
  ngAfterViewInit(): void {
    const dropdownToggle =
      this.el.nativeElement.querySelector('.dropdown-user > a');
    const dropdownMenu = this.el.nativeElement.querySelector(
      '.dropdown-user .dropdown-menu'
    );

    if (dropdownToggle && dropdownMenu) {
      this.renderer.listen(dropdownToggle, 'click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        // toggle show
        if (dropdownMenu.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
        } else {
          dropdownMenu.classList.add('show');
        }
      });

      // Click outside → close
      this.renderer.listen('document', 'click', () => {
        dropdownMenu.classList.remove('show');
      });
    }
  }
}
