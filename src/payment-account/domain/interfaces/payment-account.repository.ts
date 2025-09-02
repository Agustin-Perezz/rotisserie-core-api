import { PaymentAccount } from '@prisma/client';

export const PAYMENT_ACCOUNT_REPOSITORY = 'PAYMENT_ACCOUNT_REPOSITORY';

export interface IPaymentAccountRepository {
  upsertPaymentAccount(data: {
    userId: string;
    provider: string;
    mpUserId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: bigint;
  }): Promise<PaymentAccount>;

  findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<PaymentAccount | null>;
}
