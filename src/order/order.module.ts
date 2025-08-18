import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { OrderService } from './application/services/order.service';
import { OrderController } from './infrastructure/controllers/order.controller';
import { OrderRepository } from './infrastructure/persistence/order.repository.impl';

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService],
})
export class OrderModule {}
