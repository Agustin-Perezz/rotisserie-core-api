import { Item, Order, OrderItem, OrderStatus, Shop } from '@prisma/client';

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

export type OrderWithRelations = Order & {
  orderItems: (OrderItem & {
    item: Item;
  })[];
  shop: Shop;
};

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<OrderWithRelations>;
  findAll(): Promise<OrderWithRelations[]>;
  findById(id: string): Promise<OrderWithRelations | null>;
  findByShopId(shopId: string): Promise<OrderWithRelations[]>;
  update(id: string, data: UpdateOrderData): Promise<OrderWithRelations>;
  delete(id: string): Promise<OrderWithRelations>;
}
