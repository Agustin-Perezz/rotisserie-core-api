import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { UserRepository } from '@/users/infrastructure/persistence/user.repository.impl';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/udpate-user.dto';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.userRepository.add(data);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<User> {
    return this.userRepository.remove(id);
  }
}
