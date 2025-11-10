// services/chat.service.ts
import { Injectable, NgZone } from "@angular/core";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";

export interface InboxItem {
  _id: string;
  adminId: string;
  userId: string;
  lastMessage?: { text: string; fromId?: string; createdAt: string };
  lastMessageAt?: string;
  unreadCount: number;
  archived?: boolean;
  userSnapshot?: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket!: Socket;

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io('http://localhost:3000', { transports: ['websocket'] });
    });
  }

  // -------- Thread (đang dùng) --------
  joinThread(userId: string): Promise<{ ok: boolean; room?: string; error?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('joinThread', { userId }, (res: any) => resolve(res));
    });
  }

  loadThread(userId: string, limit = 100): Promise<any[]> {
    return new Promise((resolve) => {
      this.socket.emit('loadThread', { userId, limit }, (history: any[]) => resolve(history || []));
    });
  }

  /** Gửi tin nhắn (GIỮ event "senMessage"); fromRole = 'admin' | 'user' */
  sendMessage(userId: string, fromRole: 'admin' | 'user', msg: string): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('senMessage', { userId, fromRole, msg }, (ack: any) => resolve(ack));
    });
  }

  onMessage(): Observable<any> {
    return new Observable((observer) => {
      const handler = (m: any) => observer.next(m);
      this.socket.off('newMessage', handler);
      this.socket.on('newMessage', handler);
      return () => this.socket.off('newMessage', handler);
    });
  }

  // -------- Inbox (nếu BE đã có) --------
  loadInbox(limit = 50, cursor?: string): Promise<InboxItem[]> {
    return new Promise((resolve) => {
      this.socket.emit('loadInbox', { limit, cursor }, (rows: InboxItem[]) => resolve(rows || []));
    });
  }

  onInboxUpsert(): Observable<InboxItem> {
    return new Observable((observer) => {
      const handler = (x: InboxItem) => observer.next(x);
      this.socket.off('inbox:upsert', handler);
      this.socket.on('inbox:upsert', handler);
      return () => this.socket.off('inbox:upsert', handler);
    });
  }

  markInboxRead(userId: string): Promise<{ ok: boolean }> {
    return new Promise((resolve) => {
      this.socket.emit('inboxMarkRead', { userId }, (res: any) => resolve(res || { ok: false }));
    });
  }

  // -------- Cleanup --------
  disconnect() {
    try { this.socket?.disconnect(); } catch {}
  }
}
