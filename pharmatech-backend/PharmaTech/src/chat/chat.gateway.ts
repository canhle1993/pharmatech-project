import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

type Role = 'user' | 'admin';

@WebSocketGateway({ cors: { origin: '*', credentials: false } })
export class ChatGateWay {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  private room(userId: string) {
    return `thread:${userId}`;
  }
  // Nếu muốn đẩy sự kiện chung cho admin (đa tab), có thể dùng room admin:
  private adminRoom(adminId: string) {
    return `admin:${adminId}`;
  }

  handleConnection(client: Socket) {}
  handleDisconnect(client: Socket) {}

  /** Client (admin UI) join theo userId để nhận newMessage realtime */
  @SubscribeMessage('joinThread')
  async joinThread(
    @MessageBody() payload: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.userId) return { ok: false, error: 'userId required' };
    const r = this.room(payload.userId);
    await client.join(r);
    return { ok: true, room: r };
  }

  /** (tuỳ) join admin room nếu bạn muốn đồng bộ nhiều tab admin */
  @SubscribeMessage('joinAdmin')
  joinAdmin(
    @MessageBody() payload: { adminId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.adminId) return { ok: false, error: 'adminId required' };
    client.join(this.adminRoom(payload.adminId));
    return { ok: true };
  }

  /** Load thread cũ (history) */
  @SubscribeMessage('loadThread')
  async loadThread(@MessageBody() payload: { userId: string; limit?: number }) {
    if (!payload?.userId) return [];
    return this.chatService.loadThread(payload.userId, payload.limit ?? 100);
  }

  /** Load inbox (sidebar) */
  @SubscribeMessage('loadInbox')
  async loadInbox(@MessageBody() payload: { limit?: number; cursor?: string }) {
    const rows = await this.chatService.listInbox(
      payload?.limit ?? 50,
      payload?.cursor,
    );
    return rows;
  }

  /** Clear unread khi admin đã đọc */
  @SubscribeMessage('inboxMarkRead')
  async inboxMarkRead(@MessageBody() payload: { userId: string }) {
    if (!payload?.userId) return { ok: false, error: 'userId required' };
    const updated = await this.chatService.markRead(payload.userId);
    if (updated) {
      // emit lên admin UI để cập nhật badge ngay
      this.server.emit('inbox:upsert', updated); // hoặc emit vào adminRoom nếu có
      return { ok: true };
    }
    return { ok: false };
  }

  // ========== SEND MESSAGE ==========
  // Giữ nguyên event "senMessage" (để không vỡ client hiện tại)
  @SubscribeMessage('senMessage')
  async sendMessage(
    @MessageBody() payload: { userId: string; fromRole: string; msg: string },
  ) {
    if (!payload?.userId || !payload?.fromRole || !payload?.msg) return;

    const saved = await this.chatService.saveToThread({
      userId: payload.userId,
      fromRole: payload.fromRole, // id người gửi (user/admin)
      msg: payload.msg.trim(),
    });

    // Cập nhật INBOX: nếu tin từ user -> tăng unread; nếu từ admin -> chỉ update lastMessage
    const createdAt = (saved as any).createdAt as Date;
    const fromId = payload.fromRole;
    const text = payload.msg.trim();

    const isFromUser = payload.fromRole === 'user';
    // nếu bạn phân biệt được thì thay logic này
    // Gợi ý: nếu fromRole là 'user'/'admin' thì:
    // const isFromUser = payload.fromRole === 'user';

    if (isFromUser) {
      const updatedInbox = await this.chatService.upsertInboxOnIncomingFromUser(
        payload.userId,
        text,
        fromId,
        createdAt,
      );
      this.server.emit('inbox:upsert', updatedInbox); // đẩy lên sidebar admin
    } else {
      const updatedInbox =
        await this.chatService.upsertInboxOnOutgoingFromAdmin(
          payload.userId,
          text,
          fromId,
          createdAt,
        );
      this.server.emit('inbox:upsert', updatedInbox);
    }

    // Đẩy message mới cho những client đang ở trong room thread:userId
    this.server.to(this.room(payload.userId)).emit('newMessage', saved);

    return saved;
  }

  // Ví dụ event đặc thù (giữ nguyên)
  @SubscribeMessage('sendBid')
  async sendBid(
    @MessageBody() payload: { userId: string; price: string; fromRole?: Role },
  ) {
    if (!payload?.userId || !payload?.price)
      return { ok: false, error: 'userId/price required' };

    const saved = await this.chatService.saveToThread({
      userId: payload.userId,
      fromRole: payload.fromRole ?? 'user',
      msg: `BID: ${payload.price}`,
    });

    const createdAt = (saved as any).createdAt as Date;
    const fromId = payload.fromRole ?? 'user';
    const text = `BID: ${payload.price}`;

    const isFromUser = true; // bid giả định từ user
    if (isFromUser) {
      const updatedInbox = await this.chatService.upsertInboxOnIncomingFromUser(
        payload.userId,
        text,
        fromId,
        createdAt,
      );
      this.server.emit('inbox:upsert', updatedInbox);
    } else {
      const updatedInbox =
        await this.chatService.upsertInboxOnOutgoingFromAdmin(
          payload.userId,
          text,
          fromId,
          createdAt,
        );
      this.server.emit('inbox:upsert', updatedInbox);
    }

    this.server.to(this.room(payload.userId)).emit('newMessage', saved);
    return saved;
  }
}
