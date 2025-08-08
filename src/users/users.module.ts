import { Module } from '@nestjs/common';

import { UsersService } from './application/services/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
