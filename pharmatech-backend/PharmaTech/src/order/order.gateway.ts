import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {}

  handleDisconnect(client: any) {}

  emitNewOrder(order: any) {
    this.server.emit('new-order', order);
  }

  emitOrderStatusChanged(payload: { id: string; from: string; to: string }) {
    this.server.emit('order-status-changed', payload);
  }
}
