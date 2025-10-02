import { Injectable } from '@nestjs/common';

import { OrderRepository } from '@/order/infrastructure/persistence/order.repository.impl';

import { OrderWithRelations } from '../../domain/interfaces/order.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private orderRepository: OrderRepository) {}

  async create(orderData: CreateOrderDto): Promise<OrderWithRelations> {
    const order = await this.orderRepository.create(orderData);
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

  async findByShopId(shopId: string): Promise<OrderWithRelations[]> {
    return this.orderRepository.findByShopId(shopId);
  }

  async update(
    id: string,
    orderData: UpdateOrderDto,
  ): Promise<OrderWithRelations> {
    return this.orderRepository.update(id, orderData);
  }

  async delete(id: string): Promise<OrderWithRelations> {
    return this.orderRepository.delete(id);
  }
}
