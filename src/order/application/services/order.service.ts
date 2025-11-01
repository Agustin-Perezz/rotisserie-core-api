import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { OrderRepository } from '@/order/infrastructure/persistence/order.repository.impl';

import { OrderWithRelations } from '../../domain/interfaces/order.repository';
import { OrderGateway } from '../../infrastructure/gateways/order.gateway';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private orderGateway: OrderGateway,
  ) {}

  async create(orderData: CreateOrderDto): Promise<OrderWithRelations> {
    const order = await this.orderRepository.create(orderData);
    this.orderGateway.emitNewOrder(order.shopId, order);
    return order;
  }

  async findAll(): Promise<OrderWithRelations[]> {
    return this.orderRepository.findAll();
  }

  async findById(id: string): Promise<OrderWithRelations> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async findByShopId(
    shopId: string,
    status?: OrderStatus,
  ): Promise<OrderWithRelations[]> {
    return this.orderRepository.findByShopId(shopId, status);
  }

  async update(
    id: string,
    orderData: UpdateOrderDto,
  ): Promise<OrderWithRelations> {
    const order = await this.orderRepository.update(id, orderData);
    this.orderGateway.emitOrderUpdate(order.shopId, order);
    return order;
  }

  async delete(id: string): Promise<OrderWithRelations> {
    return this.orderRepository.delete(id);
  }
}
