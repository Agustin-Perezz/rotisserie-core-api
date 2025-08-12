import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ItemService } from './application/services/item.service';
import { ItemController } from './infrastructure/controllers/item.controller';
import { ItemRepository } from './infrastructure/persistence/item.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ItemController],
  providers: [ItemService, ItemRepository],
  exports: [ItemService],
})
export class ItemModule {}
