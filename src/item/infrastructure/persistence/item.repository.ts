import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';
import { IItemRepository } from '../../domain/interfaces/item-repository.interface';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(private prisma: PrismaService) {}

  async create(createItemDto: CreateItemDto) {
    return this.prisma.item.create({
      data: createItemDto,
    });
  }

  async findAll() {
    return this.prisma.item.findMany();
  }

  async findById(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }

  async findByShopId(shopId: string) {
    return this.prisma.item.findMany({
      where: { shopId },
    });
  }

  async findByShopName(shopName: string) {
    return this.prisma.item.findMany({
      where: {
        shop: {
          name: shopName,
        },
      },
    });
  }

  async update(id: string, updateItemDto: UpdateItemDto) {
    return this.prisma.item.update({
      where: { id },
      data: updateItemDto,
    });
  }

  async delete(id: string) {
    return this.prisma.item.delete({
      where: { id },
    });
  }
}
