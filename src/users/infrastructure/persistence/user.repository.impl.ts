import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UpdateUserDto } from '@users/application/dto/udpate-user.dto';
import { IUserRepository } from '@users/domain/interfaces/user.repository';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
