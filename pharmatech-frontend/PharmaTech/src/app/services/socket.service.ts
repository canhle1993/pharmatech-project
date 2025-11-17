import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Update if backend uses different URL
  }

  onNewQuote(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('new-quote', (data) => {
        observer.next(data);
      });
    });
  }

  onQuoteStatusChanged(): Observable<{ id: string; from: string; to: string }> {
    return new Observable(observer => {
      this.socket.on('quote-status-changed', (payload) => {
        observer.next(payload);
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
