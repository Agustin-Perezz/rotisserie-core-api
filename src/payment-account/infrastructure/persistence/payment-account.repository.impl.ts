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
    publicKey?: string;
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
        publicKey: data.publicKey,
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        mpUserId: data.mpUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        publicKey: data.publicKey,
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
