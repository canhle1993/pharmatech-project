// notification.service.ts
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type Noti = { from?: string; text: string; time?: Date | string };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Noti[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Noti[]>([]);
  messages$ = this.messagesSubject.asObservable();

  // 2 channel tách biệt cho badge 🔔 và 💬
  private chNoti?: BroadcastChannel;
  private chMsg?: BroadcastChannel;

  constructor(private zone: NgZone) {
    // Tạo channel 1 lần
    if ('BroadcastChannel' in window) {
      this.chNoti = new BroadcastChannel('pharmatech_notify');
      this.chMsg = new BroadcastChannel('pharmatech_messages');

      // Lắng nghe từ các nơi khác (Header/Chatbot/app khác injector…)
      this.chNoti.onmessage = (ev) => {
        const data = ev.data as Noti;
        this.zone.run(() => {
          const curr = this.notificationsSubject.getValue();
          const updated = [data, ...curr];
          this.notificationsSubject.next(updated);
          console.log('%c[BC] 🔔 recv', 'color:orange', data, updated);
        });
      };

      this.chMsg.onmessage = (ev) => {
        const data = ev.data as Noti;
        this.zone.run(() => {
          const curr = this.messagesSubject.getValue();
          const updated = [data, ...curr];
          this.messagesSubject.next(updated);
          console.log('%c[BC] 💬 recv', 'color:cyan', data, updated);
        });
      };
    } else {
      console.warn(
        '[NotificationService] BroadcastChannel not supported; consider localStorage events fallback'
      );
    }
  }

  // Gọi ở bất kỳ đâu để push
  pushNotification(notification: Noti) {
    // cập nhật local
    const curr = this.notificationsSubject.getValue();
    const updated = [notification, ...curr];
    this.zone.run(() => this.notificationsSubject.next(updated));
    console.log('%c[SVC] 🔔 local push', 'color:orange', updated);

    // phát qua channel cho mọi nơi khác
    this.chNoti?.postMessage(notification);
  }

  push(message: Noti) {
    const curr = this.messagesSubject.getValue();
    const updated = [message, ...curr];
    this.zone.run(() => this.messagesSubject.next(updated));
    console.log('%c[SVC] 💬 local push', 'color:cyan', updated);

    this.chMsg?.postMessage(message);
  }
}
