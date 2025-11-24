import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Update if backend uses different URL
    this.socket.on('connect', () => {
      console.log('⚡ Socket connected FE:', this.socket.id);
    });
  }

  onNewQuote(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-quote', (data) => {
        observer.next(data);
      });
    });
  }

  onQuoteStatusChanged(): Observable<{ id: string; from: string; to: string }> {
    return new Observable((observer) => {
      this.socket.on('quote-status-changed', (payload) => {
        observer.next(payload);
      });
    });
  }

  /** 🟢 Khi có đơn hàng mới */
  onNewOrder(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-order', (data) => {
        observer.next(data);
      });
    });
  }

  /** 🟡 Khi trạng thái đơn hàng thay đổi */
  onOrderStatusChanged(): Observable<{ id: string; from: string; to: string }> {
    return new Observable((observer) => {
      this.socket.on('order-status-changed', (payload) => {
        observer.next(payload);
      });
    });
  }

  // ============================
  // 🟣 APPLICATION (NEW FEATURE)
  // ============================
  onNewApplication(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-application', (data) => {
        observer.next(data);
      });
    });
  }

  onApplicationStatusChanged(): Observable<{
    id: string;
    from: string;
    to: string;
  }> {
    return new Observable((observer) => {
      this.socket.on('application-status-changed', (payload) => {
        observer.next(payload);
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
