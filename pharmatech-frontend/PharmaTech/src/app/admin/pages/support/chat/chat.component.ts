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
import { ChatService, InboxItem } from '../../../../services/chat.service';

interface ChatMessage {
  fromRole: 'user' | 'admin';
  text: string;
  createdAt?: string | Date;
}

interface Account {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  name?: string;          // ✅ chỉ có name
  is_active?: boolean;
  [k: string]: any;
}

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  inbox: InboxItem[] = [];
  filtered: InboxItem[] = [];
  q = '';

  currentUserId = '';
  history: ChatMessage[] = [];
  msg = '';

  private accountsMap: Record<string, Account> = {};
  private subMsg?: Subscription;
  private subInbox?: Subscription;

  @ViewChild('chatBoxRef') chatBoxRef!: ElementRef<HTMLDivElement>;

  constructor(
    private accounts: AccountService,
    private chat: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadAccountsMap();

    try {
      this.inbox = await this.chat.loadInbox(50);
      for (const t of this.inbox) this.ensureSnapshot(t);
    } catch {
      this.inbox = [];
    }
    this.filtered = [...this.inbox];

    this.subInbox = this.chat.onInboxUpsert().subscribe((row) => {
      this.ensureSnapshot(row);
      this.upsertInboxRow(row);
      this.cdr.detectChanges();
    });

    this.subMsg = this.chat.onMessage().subscribe((m: any) => {
      if (!this.currentUserId || m.userId !== this.currentUserId) return;
      this.history.push({
        fromRole: m.fromRole === 'user' ? 'user' : 'admin',
        text: String(m.msg ?? ''),
        createdAt: m.createdAt,
      });
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    this.subMsg?.unsubscribe();
    this.subInbox?.unsubscribe();
  }

  private async loadAccountsMap() {
    try {
      const res: any = await this.accounts.findAll();
      const list: Account[] = Array.isArray(res) ? res : res?.data ?? [];
      this.accountsMap = {};
      for (const a of list) {
        const id = (a.id as string) || (a._id as string) || '';
        if (id) this.accountsMap[id] = a;
      }
    } catch {
      this.accountsMap = {};
    }
  }

  private ensureSnapshot(row: InboxItem) {
    if (row?.userSnapshot) return;
    const a = this.accountsMap[row.userId];
    if (a) {
      row.userSnapshot = {
        name: a.name,
        username: a.username,
        email: a.email,
        is_active: a.is_active,
      };
    }
  }

  private upsertInboxRow(row: InboxItem) {
    const i = this.inbox.findIndex(x => x.userId === row.userId);
    if (i >= 0) this.inbox.splice(i, 1);
    this.inbox.unshift(row);
    this.applySearchOrdering();
  }

  onSearch() {
    const k = this.q.trim().toLowerCase();
    if (!k) { this.filtered = [...this.inbox]; return; }

    const result = this.inbox.filter((t) => {
      const s = [
        t.userSnapshot?.name,
        t.userSnapshot?.username,
        t.userSnapshot?.email,
        t.userId
      ].filter(Boolean).join(' ').toLowerCase();
      return s.includes(k);
    });

    result.sort((a, b) => {
      const ua = (a.unreadCount ?? 0) > 0 ? 1 : 0;
      const ub = (b.unreadCount ?? 0) > 0 ? 1 : 0;
      return ub - ua;
    });

    this.filtered = result;
  }

  private applySearchOrdering() {
    const k = this.q.trim().toLowerCase();
    if (!k) this.filtered = [...this.inbox];
    else this.onSearch();
  }

  async openThreadByUserId(userId: string) {
    this.currentUserId = userId;

    await this.chat.joinThread(userId);
    const raw = await this.chat.loadThread(userId, 100);
    const ordered = Array.isArray(raw) ? [...raw].reverse() : [];
    this.history = ordered.map((h: any) => ({
      fromRole: String(h.fromRole) === 'user' ? 'user' : 'admin',
      text: String(h.msg ?? ''),
      createdAt: h.createdAt,
    }));

    this.cdr.detectChanges();
    this.scrollToBottom();

    try { await this.chat.markInboxRead(userId); } catch {}
  }

  async send() {
    const text = this.msg.trim();
    console.log(localStorage.getItem("chatUserId"));
    if (!text || !this.currentUserId) return;
    await this.chat.sendMessage(this.currentUserId, localStorage.getItem("chatUserId"), text);
    this.msg = '';
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  // ===== DISPLAY HELPERS =====
  displayNameFromInbox(t: InboxItem) {
    return t?.userSnapshot?.name
        || t?.userSnapshot?.username
        || t?.userSnapshot?.email
        || t?.userId;
  }

  displayNameFromUserId(userId: string) {
    const a = this.accountsMap[userId];
    return a?.name || a?.username || a?.email || userId;
  }

  isAdminMsg(m: ChatMessage) { return m.fromRole === 'admin'; }

  trackKey(m: ChatMessage, i: number) {
    const t = m.createdAt ? String(m.createdAt) : '';
    return `${t}-${m.text}-${i}`;
  }

  private scrollToBottom() {
    queueMicrotask(() => {
      const el = this.chatBoxRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
