import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { UsersService } from './application/services/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepository } from './infrastructure/persistence/user.repository.impl';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
