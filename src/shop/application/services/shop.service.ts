import { Injectable } from '@nestjs/common';
import { Shop } from '@prisma/client';

import { ShopRepository } from '../../infrastructure/persistence/shop.repository.impl';
import { CreateShopDto } from '../dto/create-shop.dto';
import { UpdateShopDto } from '../dto/update-shop.dto';

@Injectable()
export class ShopService {
  constructor(private shopRepository: ShopRepository) {}

  async findAll(): Promise<Shop[]> {
    return this.shopRepository.findAll();
  }

  async findOne(id: string): Promise<Shop | null> {
    return this.shopRepository.findOne(id);
  }

  async findByName(name: string): Promise<Shop | null> {
    return this.shopRepository.findByName(name);
  }

  async findByOwnerId(ownerId: string): Promise<Shop[]> {
    return this.shopRepository.findByOwnerId(ownerId);
  }

  async create(data: CreateShopDto): Promise<Shop> {
    return this.shopRepository.add(data);
  }

  async update(id: string, data: UpdateShopDto): Promise<Shop> {
    return this.shopRepository.update(id, data);
  }

  async delete(id: string): Promise<Shop> {
    return this.shopRepository.remove(id);
  }
}
