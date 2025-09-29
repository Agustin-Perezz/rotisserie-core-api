import { BadRequestException, Injectable } from '@nestjs/common';
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
    publicKey?: string;
  }): Promise<PaymentAccount> {
    return this.paymentAccountRepository.upsertPaymentAccount(data);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<PaymentAccount> {
    const paymentAccount =
      await this.paymentAccountRepository.findByUserIdAndProvider(
        userId,
        provider,
      );

    if (!paymentAccount) {
      throw new BadRequestException(
        `No ${provider} payment account found for this user`,
      );
    }

    return paymentAccount;
  }
}
