import { Injectable } from '@nestjs/common';
import { PaymentAccount } from '@prisma/client';

import { PaymentAccountRepository } from '../../infrastructure/persistence/payment-account.repository.impl';

@Injectable()
export class PaymentAccountService {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async upsertPaymentAccount(data: {
    userId: string;
    provider: string;
    mpUserId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: bigint;
  }): Promise<PaymentAccount> {
    return this.paymentAccountRepository.upsertPaymentAccount(data);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<PaymentAccount | null> {
    return this.paymentAccountRepository.findByUserIdAndProvider(
      userId,
      provider,
    );
  }
}
