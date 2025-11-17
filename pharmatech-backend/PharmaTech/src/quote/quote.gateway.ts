import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', credentials: false } })
export class QuoteGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('[QuoteGateway] Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('[QuoteGateway] Client disconnected:', client.id);
  }

  // Emit event when new quote is created
  emitNewQuote(quote: any) {
    console.log('[QuoteGateway] Emitting new-quote event:', quote._id);
    this.server.emit('new-quote', quote);
  }

  // Emit when quote status changes (read/replied/deleted)
  emitQuoteStatusChanged(payload: { id: string; from: string; to: string }) {
    console.log('[QuoteGateway] Emitting quote-status-changed:', payload);
    this.server.emit('quote-status-changed', payload);
  }
}
