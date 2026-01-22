import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway({ path: '/ws/trips' })
export class TripGateway {
  @WebSocketServer()
  server!: Server;

  broadcastTripUpdate(payload: unknown) {
    this.server?.clients?.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'trip:update', payload }));
      }
    });
  }
}
