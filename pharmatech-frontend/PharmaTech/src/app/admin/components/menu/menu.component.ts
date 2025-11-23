import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { QuoteService } from '../../../services/quote.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports: [RouterLink, ButtonModule, RouterLinkActive, CommonModule],
})
export class MenuComponent implements OnInit, OnDestroy, AfterViewInit {
  unreadCount = 0;
  orderCount = 0;
  role = '';
  careerCount = 0;

  subs: Subscription[] = [];
  private socketSub?: Subscription;

  constructor(
    private renderer: Renderer2,
    private quoteService: QuoteService,
    private socketService: SocketService,
    private orderService: OrderService
  ) {}

  // ================================
  // 🔴 HỦY SOCKET + SUBSCRIPTIONS
  // ================================
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.socketSub) this.socketSub.unsubscribe();
    this.socketService.disconnect();
  }

  // ================================
  // 🔵 KHỞI TẠO
  // ================================
  ngOnInit() {
    // 1) Load số lượng order Pending
    this.orderService.getPendingCount().subscribe({
      next: (res) => (this.orderCount = res.count),
      error: (err) => console.error(err),
    });

    // 2) Order mới
    this.subs.push(
      this.socketService.onNewOrder().subscribe(() => {
        this.orderCount++;
      })
    );

    // 3) Update trạng thái order
    this.subs.push(
      this.socketService.onOrderStatusChanged().subscribe(({ from, to }) => {
        if (
          from === 'Pending Approval' &&
          (to === 'Approved' || to === 'Rejected')
        ) {
          this.orderCount = Math.max(0, this.orderCount - 1);
        }
      })
    );

    // 4) Load số lượng quote chưa đọc
    this.quoteService.getUnreadCount().subscribe({
      next: (res) => (this.unreadCount = res.count),
      error: (err) => console.error(err),
    });

    // 5) Quote mới
    this.socketSub = this.socketService.onNewQuote().subscribe(() => {
      this.unreadCount++;
    });

    // 6) Quote thay đổi trạng thái
    const statusSub = this.socketService
      .onQuoteStatusChanged()
      .subscribe(({ from, to }) => {
        if (
          from === 'unread' &&
          (to === 'read' || to === 'replied' || to === 'deleted')
        ) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });

    // Gom unsub
    if (this.socketSub) {
      const origUnsub = this.socketSub.unsubscribe.bind(this.socketSub);
      this.socketSub.unsubscribe = () => {
        statusSub.unsubscribe();
        origUnsub();
      };
    }

    // 7) ⭐ Ứng viên apply mới (Career)
    this.subs.push(
      this.socketService.onNewApplication().subscribe(() => {
        this.careerCount++;
      })
    );

    // 8) Role người dùng
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user?.roles) {
      this.role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
    }
  }

  // ================================
  // MENU TOGGLE
  // ================================
  ngAfterViewInit(): void {
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach((toggle: any) => {
      this.renderer.listen(toggle, 'click', () => {
        const parent = toggle.parentElement;

        if (parent.classList.contains('open')) {
          parent.classList.remove('open');
        } else {
          document
            .querySelectorAll('.menu-item.open')
            .forEach((item) => item.classList.remove('open'));

          parent.classList.add('open');
        }
      });
    });
  }

  resetCareerBadge() {
    this.careerCount = 0;
  }
}
