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
    constructor(private readonly chatService: ChatService) { }

    @WebSocketServer()
    server: Server;

    private room(userId: string) { return `thread:${userId}`; }

    handleConnection(client: Socket) {
        console.log('[ws] connected', client.id);
    }
    handleDisconnect(client: Socket) {
        console.log('[ws] disconnected', client.id);
    }

    @SubscribeMessage('joinThread')
    async joinThread(@MessageBody() payload: { userId: string }, @ConnectedSocket() client: Socket) {
        if (!payload?.userId) return { ok: false, error: 'userId required' };
        const r = this.room(payload.userId);
        await client.join(r);
        return { ok: true, room: r };
    }

    @SubscribeMessage('loadThread')
    async loadThread(@MessageBody() payload: { userId: string; limit?: number }) {
        if (!payload?.userId) return [];
        return this.chatService.loadThread(payload.userId, payload.limit ?? 100);
    }

    // Giữ nguyên event "senMessage"
    @SubscribeMessage('senMessage')
    async sendMessage(
        @MessageBody() payload: { userId: string; fromRole: 'user' | 'admin'; msg: string },
    ) {
        if (!payload?.userId || !payload?.fromRole || !payload?.msg) return;

        const saved = await this.chatService.saveToThread({
            userId: payload.userId,
            fromRole: payload.fromRole,
            msg: payload.msg.trim(),
        });

        this.server.to(`thread:${payload.userId}`).emit('newMessage', saved);
        return saved;
    }


    @SubscribeMessage('sendBid')
    async sendBid(@MessageBody() payload: { userId: string; price: string; fromRole?: Role }) {
        if (!payload?.userId || !payload?.price) return { ok: false, error: 'userId/price required' };
        const saved = await this.chatService.saveToThread({
            userId: payload.userId,
            fromRole: payload.fromRole ?? 'user',
            msg: `BID: ${payload.price}`,
        });
        this.server.to(this.room(payload.userId)).emit('newMessage', saved);
        return saved;
    }
}
