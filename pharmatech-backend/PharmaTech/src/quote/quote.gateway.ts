import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', credentials: false } })
export class QuoteGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {}

  handleDisconnect(client: any) {}

  // Emit event when new quote is created
  emitNewQuote(quote: any) {
    this.server.emit('new-quote', quote);
  }

  // Emit when quote status changes (read/replied/deleted)
  emitQuoteStatusChanged(payload: { id: string; from: string; to: string }) {
    this.server.emit('quote-status-changed', payload);
  }
}
