import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';
import { AccountService } from '../../../services/account.service';

type Sender = 'user' | 'bot';
interface ChatMsg {
  from: Sender;
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  imports: [ButtonModule, CommonModule, FormsModule],
})
export class ChatbotComponent implements OnInit, OnDestroy {
  userId = ''; // luôn là _id, không dùng email
  msg = '';
  open = false;

  messages: ChatMsg[] = [
    { from: 'bot', text: 'Chào bạn! Tôi có thể giúp gì hôm nay?' },
  ];

  private sub?: Subscription;

  @ViewChild('chatBoxRef') chatBoxRef!: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService
  ) {}

  async ngOnInit(): Promise<void> {
    // --- Lấy userId (ưu tiên cache, fallback từ email/token)
    const cachedId = localStorage.getItem('chatUserId');
    if (cachedId) {
      this.userId = cachedId;
      await this.initThread(this.userId);
    } else {
      const email = localStorage.getItem('token');
      if (email) {
        try {
          const user: any = await this.accountService.findByEmail(email);
          this.userId = user?._id || user?.id || '';
          if (this.userId) {
            localStorage.setItem('chatUserId', this.userId);
            await this.initThread(this.userId);
          }
        } catch (err) {
          console.error('Không tìm được user từ email:', err);
        }
      }
    }

    // --- Nghe realtime (1 listener duy nhất)
    this.sub = this.chatService.onMessage().subscribe({
      next: (serverMsg: any) => {
        this.messages.push({
          from: (serverMsg.fromRole === 'admin' ? 'bot' : 'user') as Sender,
          text: String(serverMsg.msg),
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => console.error('Lỗi ChatService:', err),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Gọi khi login xong (đã set token=email) */
  async reinitAfterLogin() {
    const email = localStorage.getItem('token');
    if (!email) return;

    try {
      const user: any = await this.accountService.findByEmail(email);
      const newId = user?._id || user?.id || '';
      if (newId && newId !== this.userId) {
        this.userId = newId;
        localStorage.setItem('chatUserId', this.userId);
        await this.initThread(this.userId);
      }
    } catch (e) {
      console.error('reinitAfterLogin error:', e);
    }
  }

  /** Gọi khi logout */
  onLogoutCleanup() {
    this.userId = '';
    localStorage.removeItem('chatUserId');
    this.messages = [{ from: 'bot', text: 'Bạn đã đăng xuất.' }];
    this.chatService.disconnect();
    this.cdr.detectChanges();
  }

  /** Join room + load lịch sử */
  private async initThread(userId: string) {
    if (!userId) return;

    await this.chatService.joinThread(userId);

    const history = await this.chatService.loadThread(userId, 100);
    const ordered = [...history].reverse();

    this.messages = [
      { from: 'bot', text: 'Chào bạn! Tôi có thể giúp gì hôm nay?' },
      ...ordered.map((h: any) => ({
        from: (h.fromRole === 'admin' ? 'bot' : 'user') as Sender,
        text: String(h.msg),
      })),
    ];

    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  toggleOpen(): void {
    this.open = !this.open;

    // Nếu vừa mở lại chat và userId bị mất thì lấy lại từ cache
    if (this.open && !this.userId) {
      const cachedId = localStorage.getItem('chatUserId');
      if (cachedId) {
        this.userId = cachedId;
        this.initThread(this.userId);
      }
    }

    setTimeout(() => this.scrollToBottom(), 0);
  }

  async send(): Promise<void> {
    const trimmed = this.msg.trim();
    if (!trimmed || !this.userId) return;

    try {
      await this.chatService.sendMessage(this.userId, 'user', trimmed);
    } catch (e) {
      console.error('Gửi tin nhắn thất bại:', e);
    }

    this.msg = '';
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (!this.chatBoxRef) return;
    const el = this.chatBoxRef.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
