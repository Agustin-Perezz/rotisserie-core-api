import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { ShopService } from './application/services/shop.service';
import { ShopController } from './infrastructure/controllers/shop.controller';
import { ShopRepository } from './infrastructure/persistence/shop.repository.impl';

@Module({
  imports: [PrismaModule],
  controllers: [ShopController],
  providers: [ShopService, ShopRepository],
  exports: [ShopService],
})
export class ShopModule {}
