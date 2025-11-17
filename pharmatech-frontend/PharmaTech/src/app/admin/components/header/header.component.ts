// header.component.ts
import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';

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
    private router: Router,
    private notifyService: NotificationService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.notifyService.notifications$.subscribe((list) => {
      this.notifications = list;
    });

    this.notifyService.messages$.subscribe((list) => {
      this.messages = list;
    });

    const storedUser = localStorage.getItem('currentUser');

    console.log('📦 currentUser stored:', storedUser);

    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    console.log('👤 Parsed user:', this.user);
    console.log('🖼 Photo:', this.user?.photo);

    setInterval(() => (this.currentTime = new Date()), 1000);
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
    // --- CSS ---
    const cssFiles = [
      'assets/admin/vendor/fonts/boxicons.css',
      'assets/admin/vendor/css/core.css',
      'assets/admin/vendor/css/theme-default.css',
      'assets/admin/css/demo.css',
      'assets/admin/vendor/libs/perfect-scrollbar/perfect-scrollbar.css',
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
      'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
    const jsFiles = [
      'assets/admin/vendor/js/helpers.js',
      'assets/admin/js/config.js',
      'assets/admin/vendor/libs/jquery/jquery.js',
      'assets/admin/vendor/libs/popper/popper.js',
      'assets/admin/vendor/js/bootstrap.js',
      'assets/admin/vendor/libs/perfect-scrollbar/perfect-scrollbar.js',
      // 'assets/admin/vendor/js/menu.js',
      'assets/admin/js/main.js',
      'https://buttons.github.io/buttons.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
