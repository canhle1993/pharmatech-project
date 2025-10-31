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
  ],
})
export class UserComponent implements OnInit {
  isHome: boolean;
  constructor(
    private accountService: AccountService,
    private router: Router,
    private renderer: Renderer2
  ) {}
  ngOnInit() {
   
    // ✅ Gán giá trị ban đầu khi component khởi tạo
    this.isHome = this.router.url === '/' || this.router.url === '/home';

    // ✅ Lắng nghe sự kiện route thay đổi sau này
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationEnd) {
        this.isHome = evt.url === '/' || evt.url === '/home';
      }
    });
  }

}
