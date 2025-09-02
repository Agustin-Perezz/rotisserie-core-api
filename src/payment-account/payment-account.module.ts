import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { PaymentAccountService } from './application/services/payment-account.service';
import { PaymentAccountRepository } from './infrastructure/persistence/payment-account.repository.impl';

@Module({
  imports: [PrismaModule],
  providers: [PaymentAccountService, PaymentAccountRepository],
  exports: [PaymentAccountService],
})
export class PaymentAccountModule {}
