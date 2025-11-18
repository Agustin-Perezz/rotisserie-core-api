import { Inject, forwardRef } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { OrderService } from '../../application/services/order.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/api/v1/orders',
})
export class OrderGateway {
  constructor(
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {}

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

  @SubscribeMessage('subscribeToOrder')
  async handleSubscribeToOrder(
    client: Socket,
    payload: { orderId: string; userId: string },
  ) {
    try {
      const order = await this.orderService.findById(payload.orderId);

      if (order.userId !== payload.userId) {
        return {
          success: false,
          message: 'Unauthorized: User does not own this order',
        };
      }

      client.join(`user:${payload.userId}`);
      return {
        success: true,
        message: `Subscribed to order ${payload.orderId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to subscribe',
      };
    }
  }

  @SubscribeMessage('unsubscribeFromOrder')
  handleUnsubscribeFromOrder(client: Socket, payload: { userId: string }) {
    client.leave(`user:${payload.userId}`);
    return {
      success: true,
      message: `Unsubscribed from user notifications`,
    };
  }

  emitNewOrder(shopId: string, orderData: any) {
    this.server.to(`shop:${shopId}`).emit('newOrder', orderData);
  }

  emitOrderUpdate(shopId: string, userId: string, orderData: any) {
    this.server.to(`shop:${shopId}`).emit('orderUpdated', orderData);
    this.server.to(`user:${userId}`).emit('orderUpdated', orderData);
  }
}
