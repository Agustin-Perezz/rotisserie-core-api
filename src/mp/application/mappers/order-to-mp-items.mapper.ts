import { OrderWithRelations } from '@/order/domain/interfaces/order.repository';

import { ItemMp } from '../../domain/interfaces/item-mp.interface';

export class OrderToMpItemsMapper {
  static mapOrderItemsToMpItems(order: OrderWithRelations): ItemMp[] {
    return order.orderItems.map((orderItem) => ({
      id: orderItem.item.id,
      title: orderItem.item.name,
      quantity: orderItem.quantity,
      unit_price: orderItem.item.price,
    }));
  }
}
