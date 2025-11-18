import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../services/account.service';
import { ButtonModule } from 'primeng/button';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { MenuComponent } from './components/menu/menu.component';
import { ChatAIComponent } from './components/chatAI/chatAI.component';
import { AiGPTComponent } from './components/aiGPT/aiGPT.component';
import { NgChartsModule } from 'ng2-charts';

@Component({
  standalone: true,
  templateUrl: './admin.component.html',
  imports: [
    RouterOutlet,
    ButtonModule,
    HeaderComponent,
    FooterComponent,
    MenuComponent,
    // ChatAIComponent,
    AiGPTComponent,
    NgChartsModule,
  ],
})
export class AdminComponent implements OnInit, AfterViewInit {
  user: any = null;
  constructor(
    private accountService: AccountService,
    private router: Router,
    private renderer: Renderer2
  ) {}
  ngOnInit() {
    this.autoReloadOnce(); // ✅ Thêm hàm reload 1 lần duy nhất
    // const storedUser = localStorage.getItem('currentUser');

    // console.log('📦 currentUser stored:', storedUser);

    // if (storedUser) {
    //   this.user = JSON.parse(storedUser);
    // }

    // console.log('👤 Parsed user:', this.user);
    // console.log('🖼 Photo:', this.user?.photo);
  }
  /**
   * 🔁 Reload trang Admin đúng 1 lần duy nhất khi truy cập
   */
  private autoReloadOnce(): void {
    const reloaded = sessionStorage.getItem('admin-page-reloaded');
    if (!reloaded) {
      sessionStorage.setItem('admin-page-reloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('admin-page-reloaded');
    }
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
      // 'assets/admin/vendor/libs/jquery/jquery.js',
      // 'assets/admin/vendor/libs/popper/popper.js',
      // 'assets/admin/vendor/js/bootstrap.js',
      'assets/admin/vendor/libs/perfect-scrollbar/perfect-scrollbar.js',
      // 'assets/admin/vendor/js/menu.js',
      // 'assets/admin/js/main.js',
      'https://buttons.github.io/buttons.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
  logout() {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
