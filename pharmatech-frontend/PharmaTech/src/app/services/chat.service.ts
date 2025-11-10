// services/chat.service.ts
import { Injectable, NgZone } from "@angular/core";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";

//export type ChatRole = 'user' | 'admin';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket!: Socket;

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket'],
      });
    });
  }

  /** Vào phòng của userId để nhận realtime */
  joinThread(userId: string): Promise<{ ok: boolean; room?: string; error?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('joinThread', { userId }, (res: any) => resolve(res));
    });
  }

  /** Lấy lịch sử của userId (server trả mảng ChatThreadMessage) */
  loadThread(userId: string, limit = 100): Promise<any[]> {
    return new Promise((resolve) => {
      this.socket.emit('loadThread', { userId, limit }, (history: any[]) => {
        resolve(history || []);
      });
    });
  }

  /** Gửi tin nhắn (giữ event tên "senMessage") */
  sendMessage(userId: string, fromRole: string, msg: string): Promise<any> {
    console.log('Sending message via socket.io', { userId, fromRole, msg });
    return new Promise((resolve) => {
      this.socket.emit('senMessage', { userId, fromRole, msg }, (ack: any) => resolve(ack));
    });
  }

  /** Lắng tin realtime trong room đã join */
  onMessage(): Observable<any> {
    return new Observable((observer) => {
      const handler = (m: any) => observer.next(m);
      this.socket.off('newMessage', handler);
      this.socket.on('newMessage', handler);
      return () => this.socket.off('newMessage', handler);
    });
  }

  /** Dọn socket khi logout (tuỳ bạn có muốn disconnect hẳn hay không) */
  disconnect() {
    try { this.socket?.disconnect(); } catch { }
  }

  
}
