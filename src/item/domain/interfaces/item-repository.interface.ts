import { Item } from '@prisma/client';

import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';

export interface IItemRepository {
  create(createItemDto: CreateItemDto): Promise<Item>;
  findAll(): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  update(id: string, updateItemDto: UpdateItemDto): Promise<Item>;
  delete(id: string): Promise<Item>;
  findByShopId(shopId: string): Promise<Item[]>;
}
