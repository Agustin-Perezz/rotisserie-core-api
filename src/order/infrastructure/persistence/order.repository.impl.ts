import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateOrderData,
  IOrderRepository,
  UpdateOrderData,
} from '../../domain/interfaces/order.repository';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderData): Promise<Order> {
    const { orderItems, ...orderData } = data;

    return this.prisma.order.create({
      data: {
        ...orderData,
        status: orderData.status || OrderStatus.PENDING,
        orderItems: {
          create: orderItems.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity || 1,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }

  async findByShopId(shopId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        shopId,
        deletedAt: null,
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }

  async update(id: string, data: UpdateOrderData): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }

  async delete(id: string): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
    });
  }
}
