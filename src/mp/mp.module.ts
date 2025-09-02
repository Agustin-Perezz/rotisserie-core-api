import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { PaymentAccountModule } from '@/payment-account/payment-account.module';

import { MercadoPagoService } from './application/services/mercado-pago.service';
import { MpController } from './infrastructure/controllers/mp.controller';

@Module({
  imports: [PrismaModule, PaymentAccountModule],
  controllers: [MpController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MpModule {}
