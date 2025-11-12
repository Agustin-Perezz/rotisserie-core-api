import { Item, ItemImage } from '@prisma/client';

import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';

export type ItemWithImages = Item & { images: ItemImage[] };

export interface IItemRepository {
  create(data: CreateItemDto): Promise<Item>;
  findAll(): Promise<ItemWithImages[]>;
  findById(id: string): Promise<ItemWithImages | null>;
  update(id: string, data: UpdateItemDto): Promise<Item>;
  delete(id: string): Promise<Item>;
  findByShopId(shopId: string): Promise<ItemWithImages[]>;
  findByShopName(shopName: string): Promise<ItemWithImages[]>;
  deleteImage(imageId: string): Promise<ItemImage>;
}
