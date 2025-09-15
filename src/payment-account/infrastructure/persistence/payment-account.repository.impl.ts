import { Injectable } from '@nestjs/common';
import { PaymentAccount } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { IPaymentAccountRepository } from '../../domain/interfaces/payment-account.repository';

@Injectable()
export class PaymentAccountRepository implements IPaymentAccountRepository {
  constructor(private prisma: PrismaService) {}

  async upsertPaymentAccount(data: {
    userId: string;
    provider: string;
    mpUserId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: bigint;
  }): Promise<PaymentAccount> {
    return this.prisma.paymentAccount.upsert({
      where: {
        userId_provider: {
          userId: data.userId,
          provider: data.provider,
        },
      },
      update: {
        mpUserId: data.mpUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        mpUserId: data.mpUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      },
    });
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<PaymentAccount | null> {
    return this.prisma.paymentAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }
}
