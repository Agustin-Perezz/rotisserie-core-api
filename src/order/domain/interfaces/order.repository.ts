import { Order } from '@prisma/client';

export interface CreateOrderData {
  shopId: string;
  status?: string;
  orderItems: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export interface UpdateOrderData {
  status?: string;
}

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findByShopId(shopId: string): Promise<Order[]>;
  update(id: string, data: UpdateOrderData): Promise<Order>;
  delete(id: string): Promise<Order>;
}
