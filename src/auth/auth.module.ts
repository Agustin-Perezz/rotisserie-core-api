import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@prisma/prisma.module';
import { UsersModule } from '@users/users.module';

import { AuthService } from './application/services/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';

@Module({
  imports: [UsersModule, PassportModule, PrismaModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
