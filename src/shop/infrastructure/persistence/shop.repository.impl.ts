import { BadRequestException, Injectable } from '@nestjs/common';
import { Shop } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateShopDto } from '../../application/dto/create-shop.dto';
import { UpdateShopDto } from '../../application/dto/update-shop.dto';
import { IShopRepository } from '../../domain/interfaces/shop.repository';

@Injectable()
export class ShopRepository implements IShopRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Shop[]> {
    return this.prisma.shop.findMany();
  }

  async findOne(id: string): Promise<Shop | null> {
    return this.prisma.shop.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async findByName(name: string): Promise<Shop | null> {
    return this.prisma.shop.findFirst({
      where: { name },
      include: {
        items: true,
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Shop[]> {
    return this.prisma.shop.findMany({
      where: { ownerId },
      include: {
        items: true,
      },
    });
  }

  async add(data: CreateShopDto): Promise<Shop> {
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
    });

    if (!owner) {
      throw new BadRequestException('Owner not found');
    }

    return this.prisma.shop.create({ data });
  }

  async update(id: string, data: UpdateShopDto): Promise<Shop> {
    return this.prisma.shop.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Shop> {
    return this.prisma.shop.delete({
      where: { id },
    });
  }
}
