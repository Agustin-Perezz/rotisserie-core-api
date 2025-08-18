import { Order, OrderStatus } from '@prisma/client';

export interface CreateOrderData {
  shopId: string;
  status?: OrderStatus;
  orderItems: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export interface UpdateOrderData {
  status?: OrderStatus;
}

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findByShopId(shopId: string): Promise<Order[]>;
  update(id: string, data: UpdateOrderData): Promise<Order>;
  delete(id: string): Promise<Order>;
}
