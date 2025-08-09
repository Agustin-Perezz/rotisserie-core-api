import { Module } from '@nestjs/common';

import { ShopService } from './application/services/shop.service';
import { ShopController } from './infrastructure/controllers/shop.controller';

@Module({
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
