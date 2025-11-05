import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import {
  NavigationEnd,
  Event,
  Router,
  RouterLink,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AccountService } from '../services/account.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'app-user',
  standalone: true,
  templateUrl: './user.component.html',
  imports: [
    ButtonModule,
    RouterOutlet,
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    CarouselComponent,
    ChatbotComponent,
  ],
})
export class UserComponent implements OnInit {
  isHome: boolean;
  constructor(
    private accountService: AccountService,
    private router: Router,
    private renderer: Renderer2
  ) {}
  async ngOnInit() {
    await this.loadAssets(); // ⬅️ await để chắc JS đã sẵn sàng

    // ✅ Gán giá trị ban đầu khi component khởi tạo
    this.isHome = this.router.url === '/' || this.router.url === '/home';

    // ✅ Lắng nghe sự kiện route thay đổi sau này
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationEnd) {
        this.isHome = evt.url === '/' || evt.url === '/home';
      }
    });
  }

  /** 🧩 Load CSS + JS (tuần tự) */
  private async loadAssets() {
    const addCss = (href: string) =>
      new Promise<void>((resolve) => {
        const link = this.renderer.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        this.renderer.appendChild(document.head, link);
      });

    const addJs = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = this.renderer.createElement('script');
        s.src = src;
        s.type = 'text/javascript';
        s.onload = () => resolve();
        s.onerror = (e: any) => reject(e);
        this.renderer.appendChild(document.body, s);
      });

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
    for (const href of cssFiles) await addCss(href);

    // ✅ BẮT BUỘC: jQuery trước, rồi mới các script khác
    await addJs('assets/js/vendor/jquery-3.6.0.min.js');
    await addJs('assets/js/vendor/jquery-migrate-3.3.2.min.js');
    await addJs('assets/js/vendor/bootstrap.bundle.min.js');
    await addJs('assets/js/countdown.min.js');
    await addJs('assets/js/ajax.js');
    await addJs('assets/js/jquery.validate.min.js');
    await addJs('assets/js/swiper-bundle.min.js');
    await addJs('assets/js/ion.rangeSlider.min.js');
    await addJs('assets/js/lightgallery.min.js');
    await addJs('assets/js/jquery.magnific-popup.min.js');
    await addJs('assets/js/main.js');
  }

}
