import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@prisma/prisma.module';

import { MercadoPagoService } from './application/services/mercado-pago.service';
import { MpController } from './infrastructure/controllers/mp.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MpController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MpModule {}
