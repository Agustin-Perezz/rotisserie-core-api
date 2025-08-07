import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './application/services/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
