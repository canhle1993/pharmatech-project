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
import { ApplicationService } from '../../../services/application.service';

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
    private orderService: OrderService,
    private applicationService: ApplicationService
  ) {}
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.socketSub) this.socketSub.unsubscribe();
    this.socketService.disconnect();
  }
  ngOnInit() {
    // ------------------------------
    // 1) Load pending count từ backend
    // ------------------------------
    this.orderService.getPendingCount().subscribe({
      next: (res) => {
        this.orderCount = res.count;
      },
      error: (err) => {
        console.error('Error loading order pending count:', err);
      },
    });

    // ------------------------------
    // 2) Lắng nghe đơn hàng mới qua socket
    // ------------------------------
    this.socketService.onNewOrder().subscribe(() => {
      this.orderCount++;
    });

    // ------------------------------
    // 3) Lắng nghe trạng thái thay đổi
    // ------------------------------
    // Lắng nghe trạng thái đơn thay đổi
    this.socketService.onOrderStatusChanged().subscribe(({ from, to }) => {
      console.log('SOCKET order change:', from, '=>', to);

      // Pending Approval -> Approved = đơn được duyệt
      // Pending Approval -> Rejected = đơn bị từ chối
      if (
        from === 'Pending Approval' &&
        (to === 'Approved' || to === 'Rejected')
      ) {
        this.orderCount = Math.max(0, this.orderCount - 1);
      }
    });

    // Lấy số lượng quote chưa đọc ban đầu
    this.quoteService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount = response.count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      },
    });

    // Lắng nghe sự kiện quote mới qua socket
    this.socketSub = this.socketService.onNewQuote().subscribe(() => {
      this.unreadCount++;
    });

    // Lắng nghe thay đổi trạng thái quote (read/replied/deleted)
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
    // Gộp subscriptions
    if (this.socketSub) {
      const originalUnsub = this.socketSub.unsubscribe.bind(this.socketSub);
      this.socketSub.unsubscribe = () => {
        statusSub.unsubscribe();
        originalUnsub();
      };
    }

    /* ================================
     * 3️⃣ CAREER BADGE (NEW FEATURE)
     ================================= */

    // ⭐ Load pending count khi F5
    this.applicationService.getPendingCount().then((res) => {
      this.careerCount = res.count;
    });

    // ⭐ Tăng khi có ứng viên apply mới qua WebSocket
    this.subs.push(
      this.socketService.onNewApplication().subscribe(() => {
        this.careerCount++;
      })
    );

    // ⭐ Giảm khi trạng thái hồ sơ thay đổi (pending -> reviewed/interview/passed/rejected)
    this.subs.push(
      this.socketService
        .onApplicationStatusChanged()
        .subscribe(({ from, to }) => {
          console.log('🔥 Application changed:', from, '=>', to);

          if (from === 'pending' && to !== 'pending') {
            this.careerCount = Math.max(0, this.careerCount - 1);
          }
        })
    );

    // 8) Role người dùng
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user?.roles) {
      this.role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
    }
  }

  ngAfterViewInit(): void {
    // ==========================
    //  1) Tự tạo toggle cho menu
    // ==========================

    const menuToggles = document.querySelectorAll('.menu-toggle');

    menuToggles.forEach((toggle: any) => {
      this.renderer.listen(toggle, 'click', () => {
        const parent = toggle.parentElement;

        // Nếu đang mở thì đóng
        if (parent.classList.contains('open')) {
          parent.classList.remove('open');
        } else {
          // Đóng tất cả cái khác
          document
            .querySelectorAll('.menu-item.open')
            .forEach((item) => item.classList.remove('open'));

          // Mở cái đang click
          parent.classList.add('open');
        }
      });
    });
  }

  resetCareerBadge() {
    this.careerCount = 0;
  }
}
