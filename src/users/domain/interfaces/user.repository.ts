import { User } from '@prisma/client';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UpdateUserDto } from '@users/application/dto/udpate-user.dto';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findOne(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: number, data: UpdateUserDto): Promise<User>;
  delete(id: number): Promise<User>;
}
