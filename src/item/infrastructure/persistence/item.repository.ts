import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';
import { IItemRepository } from '../../domain/interfaces/item-repository.interface';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateItemDto) {
    const imagesData = data.images?.map((url) => ({ url }));
    return this.prisma.item.create({
      data: {
        ...data,
        images: {
          create: imagesData,
        },
      },
      include: {
        images: true,
      },
    });
  }

  async findAll() {
    return this.prisma.item.findMany({
      include: {
        images: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });
  }

  async findByShopId(shopId: string) {
    return this.prisma.item.findMany({
      where: { shopId },
      include: {
        images: true,
      },
    });
  }

  async findByShopName(shopName: string) {
    return this.prisma.item.findMany({
      where: {
        shop: {
          name: shopName,
        },
      },
      include: {
        images: true,
      },
    });
  }

  async update(id: string, data: UpdateItemDto) {
    const imagesData = data.images?.map((url) => ({ url }));
    return this.prisma.item.update({
      where: { id },
      data: {
        ...data,
        images: {
          deleteMany: {},
          create: imagesData,
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.item.delete({
      where: { id },
    });
  }
}
