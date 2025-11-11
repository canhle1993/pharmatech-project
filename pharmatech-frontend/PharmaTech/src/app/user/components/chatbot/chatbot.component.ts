import {
  ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';

import { ChatService } from '../../../services/chat.service';



interface ChatMsg {
  from: String;   // map từ fromRole string
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
  userId = localStorage.getItem('chatUserId') || ''; // nếu có thì dùng, không thì để rỗng
  open = false;
  msg = '';

  messages: ChatMsg[] = [
    { from: '', text: 'Chào bạn! Tôi có thể giúp gì hôm nay?' },
  ];

  private sub?: Subscription;

  @ViewChild('chatBoxRef') chatBoxRef!: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  // từ fromRole (string) → 'user' | 'bot'
  private mapRole(fromRole: any): String {
    return typeof fromRole === 'string' && fromRole.toLowerCase() === 'user'
      ? 'user'
      : '';
  }

  async ngOnInit(): Promise<void> {
    // Nếu đã có userId thì join và load lịch sử
    if (this.userId) {
      await this.initThread(this.userId);
    }
   
    // nghe realtime
    this.sub = this.chatService.onMessage().subscribe((srv: any) => {
      // srv: { userId, fromRole: string, msg: string }
      if (this.userId && srv.userId !== this.userId) return; // khác thread thì bỏ
      this.messages.push({
        from: this.mapRole(srv.fromRole),
        text: String(srv.msg),
      });
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // cho app khác tự set userId khi login xong (đơn giản)
  setUserId(id: string) {
    this.userId = id || '';
    if (this.userId) {
      localStorage.setItem('chatUserId', this.userId);
      this.initThread(this.userId);
    }
  }

  private async initThread(userId: string) {
    await this.chatService.joinThread(userId);
    const history = await this.chatService.loadThread(userId, 50); // [{fromRole, msg}]
    const ordered = [...history].reverse();
    this.messages = [
      { from: '', text: 'Chào bạn! Tôi có thể giúp gì hôm nay?' },
      ...ordered.map((h: any) => ({
        from: this.mapRole(h.fromRole),
        text: String(h.msg),
      })),
    ];
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  toggleOpen(): void {
    this.open = !this.open;
    setTimeout(() => this.scrollToBottom(), 0);
  }

  async send(): Promise<void> {
    const text = this.msg.trim();
    if (!text || !this.userId) return;

    // user gửi → fromRole = 'user'
    await this.chatService.sendMessage(this.userId, 'user', text);

    // không push local để tránh trùng; đợi server echo
    this.msg = '';
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const el = this.chatBoxRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
