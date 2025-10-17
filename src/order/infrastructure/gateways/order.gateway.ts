import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/api/v1/orders',
})
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribeToShop')
  handleSubscribeToShop(client: Socket, shopId: string) {
    client.join(`shop:${shopId}`);
    return { success: true, message: `Subscribed to shop ${shopId}` };
  }

  @SubscribeMessage('unsubscribeFromShop')
  handleUnsubscribeFromShop(client: Socket, shopId: string) {
    client.leave(`shop:${shopId}`);
    return { success: true, message: `Unsubscribed from shop ${shopId}` };
  }

  emitNewOrder(shopId: string, orderData: any) {
    this.server.to(`shop:${shopId}`).emit('newOrder', orderData);
  }

  emitOrderUpdate(shopId: string, orderData: any) {
    this.server.to(`shop:${shopId}`).emit('orderUpdated', orderData);
  }
}
