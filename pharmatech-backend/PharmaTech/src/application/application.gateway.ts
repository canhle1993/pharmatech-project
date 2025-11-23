import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ApplicationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('🔥 Application WebSocket Gateway initialized');
  }

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }

  /** 🔥 Emit khi có ứng viên apply job */
  emitNewApplication(app: any) {
    this.server.emit('new-application', {
      id: app._id,
      career_title: app.career_id?.title,
      candidate_name: app.account_id?.name,
    });
  }
}
