import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';

import { AccountService } from '../../../../services/account.service';
import { ChatService } from '../../../../services/chat.service';

interface ChatMessage {
  fromRole: string;      // "user", "admin", hoặc id admin (luôn là string)
  text: string;
  createdAt?: string | Date;
}

interface Account {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  // -------- STATE: USERS ----------
  users: Account[] = [];
  filtered: Account[] = [];
  q = '';

  // -------- STATE: CURRENT THREAD ----------
  currentUser?: Account;
  currentUserId = '';

  // -------- STATE: CHAT ----------
  msg = '';
  history: ChatMessage[] = [];

  // unread counter cho từng userId (>=1 là chưa đọc)
  private unread: Record<string, number> = {};

  private sub?: Subscription;

  @ViewChild('chatBoxRef') chatBoxRef!: ElementRef<HTMLDivElement>;

  constructor(
    private accounts: AccountService,
    private chat: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  // ================== INIT / DESTROY ==================
  async ngOnInit() {
    await this.loadUsers();

    // Nghe tin nhắn realtime
    this.sub = this.chat.onMessage().subscribe((m: any) => {
      // m = { userId, fromRole, msg, createdAt }

      // Nếu đang mở đúng thread => thêm vào lịch sử
      if (this.currentUserId && m.userId === this.currentUserId) {
        this.history.push({
          fromRole: String(m.fromRole ?? ''),
          text: String(m.msg ?? ''),
          createdAt: m.createdAt,
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
        return;
      }

      // Nếu là user khác: đánh dấu unread + đẩy user lên đầu danh sách
      const uid = String(m?.userId ?? '');
      if (uid) {
        // tăng số lượng chưa đọc
        this.unread[uid] = (this.unread[uid] ?? 0) + 1;

        // đẩy user lên đầu users
        this.bumpUserToTop(uid);

        // nếu user chưa có trong users (hiếm), thêm entry mỏng
        if (!this.users.some((u) => this.getUserId(u) === uid)) {
          this.users.unshift({ _id: uid, username: uid } as Account);
        }

        // cập nhật filtered theo search + ưu tiên unread
        this.applySearchOrdering();
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // ================== USERS ==================
  private async loadUsers() {
    try {
      const res: any = await this.accounts.findAll();
      const list: Account[] = Array.isArray(res) ? res : res?.data ?? [];
      this.users = [...list];
      this.filtered = [...list];
    } catch (e) {
      console.error('Load users failed:', e);
      this.users = [];
      this.filtered = [];
    }
  }

  onSearch() {
    const k = this.q.trim().toLowerCase();
    if (!k) {
      // không filter => dùng ordering hiện tại của users
      this.filtered = [...this.users];
      return;
    }

    const result = this.users.filter((u) => {
      const s = [
        u.full_name,
        u.username,
        u.email,
        (u.id ?? u._id ?? '').toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return s.includes(k);
    });

    // ưu tiên user unread trước
    result.sort((a, b) => {
      const ua = (this.unread[this.getUserId(a)] ?? 0) > 0 ? 1 : 0;
      const ub = (this.unread[this.getUserId(b)] ?? 0) > 0 ? 1 : 0;
      return ub - ua;
    });

    this.filtered = result;
  }

  /** Giữ filtered theo search hiện tại + ưu tiên unread lên trước */
  private applySearchOrdering() {
    const k = this.q.trim().toLowerCase();
    if (!k) {
      this.filtered = [...this.users];
    } else {
      this.onSearch();
    }
  }

  /** Đưa userId lên đầu mảng users */
  private bumpUserToTop(userId: string) {
    const idx = this.users.findIndex((u) => this.getUserId(u) === userId);
    if (idx > 0) {
      const [u] = this.users.splice(idx, 1);
      this.users.unshift(u);
    }
  }

  isUnread(uid: string): boolean {
    return (this.unread[uid] ?? 0) > 0;
  }

  // ================== THREAD ==================
  async openThread(u: Account) {
    const uid = this.getUserId(u);
    if (!uid) return;

    this.currentUser = u;
    this.currentUserId = uid;

    // Mở thread => clear unread
    if (this.unread[uid]) {
      delete this.unread[uid];
      this.cdr.detectChanges();
    }

    // Tham gia phòng + load lịch sử
    await this.chat.joinThread(uid);
    const raw = await this.chat.loadThread(uid, 100); // giả định trả về mảng newest->oldest

    const ordered = Array.isArray(raw) ? [...raw].reverse() : [];
    this.history = ordered.map((h: any) => ({
      fromRole: String(h.fromRole ?? ''),
      text: String(h.msg ?? ''),
      createdAt: h.createdAt,
    }));

    // đảm bảo user đang mở đứng đầu nếu cần
    this.bumpUserToTop(uid);
    this.applySearchOrdering();

    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  // ================== SEND ==================
  async send() {
    const text = this.msg.trim();
    if (!text || !this.currentUserId) return;

    // Lấy adminId (giữ theo logic hiện có của bạn)
    const token = localStorage.getItem('token');
    const admin = (await this.accounts.findByEmail(token)) as Account;
    const adminId = admin?._id || admin?.id;

    console.log('Send message:', { to: this.currentUserId, from: adminId, text });

    await this.chat.sendMessage(this.currentUserId, adminId, text);

    this.msg = '';
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  // ================== UI HELPERS ==================
  displayName(u: Account) {
    return u.full_name || u.username || u.email || this.getUserId(u);
  }

  displayId(u: Account) {
    return this.getUserId(u);
  }

  isAdminMsg(m: ChatMessage): boolean {
    // Nếu fromRole là 'user' => user, còn lại (id, 'admin', v.v.) => admin
    return typeof m.fromRole === 'string' && m.fromRole.toLowerCase() !== 'user';
  }

  trackKey(m: ChatMessage, i: number): string {
    const t = m.createdAt ? String(m.createdAt) : '';
    return `${t}-${m.text}-${i}`;
  }

  private getUserId(u: Account): string {
    return (
      (u.id as string) ||
      (u._id as string) ||
      (u.username as string) ||
      (u.email as string) ||
      ''
    );
  }

  private scrollToBottom() {
    queueMicrotask(() => {
      const el = this.chatBoxRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
