import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

import { Subscription } from 'rxjs';
import { AccountService } from '../../../../services/account.service';
import { ChatService } from '../../../../services/chat.service';

type Sender = 'user' | 'admin';
interface UiMsg { from: Sender; text: string; createdAt?: string | Date; }

interface Account {
  id?: string;            // tuỳ backend
  _id?: string;           // nếu dùng Mongo
  username?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  // ...các field khác
}

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  // danh sách user từ AccountService
  users: Account[] = [];
  filtered: Account[] = [];
  q = '';                        // ô search

  // thread hiện tại
  currentUser?: Account;
  currentUserId = '';

  // chat state
  msg = '';
  history: UiMsg[] = [];

  private sub?: Subscription;

  @ViewChild('chatBoxRef') chatBoxRef!: ElementRef<HTMLDivElement>;

  constructor(
    private accounts: AccountService,
    private chat: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadUsers();

    // lắng message realtime duy nhất 1 listener
    this.sub = this.chat.onMessage().subscribe((m: any) => {
      // m: { userId, fromRole, msg, createdAt, ... }
      if (!this.currentUserId || m.userId !== this.currentUserId) return; // khác thread → bỏ
      this.history.push({
        from: m.fromRole === 'admin' ? 'admin' : 'user',
        text: m.msg,
        createdAt: m.createdAt,
      });
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // --- USERS ---------------------------------------------------------------

  private async loadUsers() {
    try {
      const res: any = await this.accounts.findAll(); // bạn đã có API này
      // tuỳ API trả mảng ở đâu (res hay res.data)
      const list: Account[] = Array.isArray(res) ? res : (res?.data ?? []);
      this.users = list;
      this.filtered = list;
    } catch (e) {
      console.error('Load users failed:', e);
      this.users = this.filtered = [];
    }
  }

  onSearch() {
    const k = this.q.trim().toLowerCase();
    if (!k) {
      this.filtered = this.users;
      return;
    }
    this.filtered = this.users.filter(u => {
      const s = [
        u.full_name,
        u.username,
        u.email,
        (u.id ?? u._id ?? '').toString(),
      ].filter(Boolean).join(' ').toLowerCase();
      return s.includes(k);
    });
  }

  // Lấy userId dùng cho chat thread
  private getUserId(u: Account): string {
    // Ưu tiên id/_id; fallback username/email nếu hệ thống đang dùng vậy làm khóa
    return (u.id as string) || (u._id as string) || (u.username as string) || (u.email as string) || '';
  }

  // --- THREAD --------------------------------------------------------------

  async openThread(u: Account) {
    const uid = this.getUserId(u);
    if (!uid) return;

    this.currentUser = u;
    this.currentUserId = uid;

    // join room + load lịch sử
    await this.chat.joinThread(uid);
    const raw = await this.chat.loadThread(uid, 100);

    // đảo cho cũ → mới
    const ordered = [...raw].reverse();

    this.history = ordered.map((h: any) => ({
      from: h.fromRole === 'admin' ? 'admin' : 'user',
      text: h.msg,
      createdAt: h.createdAt,
    }));

    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  async send() {
    const text = this.msg.trim();
    if (!text || !this.currentUserId) return;

    // gửi với fromRole='admin'; không push local, đợi server echo để đồng bộ DB
    await this.chat.sendMessage(this.currentUserId, 'admin', text);
    this.msg = '';
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  // --- UI helpers ----------------------------------------------------------

  displayName(u: Account) {
    return u.full_name || u.username || u.email || this.getUserId(u);
  }
  displayId(u: Account) {
    return this.getUserId(u);
  }

  private scrollToBottom() {
    if (!this.chatBoxRef) return;
    const el = this.chatBoxRef.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
