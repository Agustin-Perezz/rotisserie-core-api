import { Module } from '@nestjs/common';

import { OrderModule } from '@/order/order.module';
import { PaymentAccountModule } from '@/payment-account/payment-account.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { MercadoPagoService } from './application/services/mercado-pago.service';
import { MpController } from './infrastructure/controllers/mp.controller';

@Module({
  imports: [PrismaModule, PaymentAccountModule, OrderModule],
  controllers: [MpController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MpModule {}
