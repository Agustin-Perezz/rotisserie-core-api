import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateOrderData,
  IOrderRepository,
  OrderWithRelations,
  UpdateOrderData,
} from '../../domain/interfaces/order.repository';
import { getDateRange } from '../../domain/utils/date.utils';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderData): Promise<OrderWithRelations> {
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

  async findAll(): Promise<OrderWithRelations[]> {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
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

  async findByShopId(
    shopId: string,
    status?: OrderStatus,
  ): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: {
        shopId,
        deletedAt: null,
        ...(status && { status }),
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(
    userId: string,
    createdAt?: string,
  ): Promise<OrderWithRelations[]> {
    const dateFilter = createdAt ? getDateRange(createdAt) : undefined;

    return this.prisma.order.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        shop: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: UpdateOrderData): Promise<OrderWithRelations> {
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

  async delete(id: string): Promise<OrderWithRelations> {
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
