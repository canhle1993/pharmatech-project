import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { QuoteService } from '../../../services/quote.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports: [RouterLink, ButtonModule, RouterLinkActive, CommonModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  private socketSub?: Subscription;

  constructor(
    private quoteService: QuoteService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    // Lấy số lượng quote chưa đọc ban đầu
    this.quoteService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount = response.count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });

    // Lắng nghe sự kiện quote mới qua socket
    this.socketSub = this.socketService.onNewQuote().subscribe(() => {
      this.unreadCount++;
    });

    // Lắng nghe thay đổi trạng thái quote (read/replied/deleted)
    const statusSub = this.socketService.onQuoteStatusChanged().subscribe(({ from, to }) => {
      if (from === 'unread' && (to === 'read' || to === 'replied' || to === 'deleted')) {
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
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
    this.socketService.disconnect();
  }
}
