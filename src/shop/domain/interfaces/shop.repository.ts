import { Shop } from '@prisma/client';

import { CreateShopDto } from '../../application/dto/create-shop.dto';
import { UpdateShopDto } from '../../application/dto/update-shop.dto';

export interface IShopRepository {
  findAll(): Promise<Shop[]>;
  findOne(id: string): Promise<Shop | null>;
  findByName(name: string): Promise<Shop | null>;
  findByOwnerId(ownerId: string): Promise<Shop[]>;
  add(data: CreateShopDto): Promise<Shop>;
  update(id: string, data: UpdateShopDto): Promise<Shop>;
  remove(id: string): Promise<Shop>;
}
