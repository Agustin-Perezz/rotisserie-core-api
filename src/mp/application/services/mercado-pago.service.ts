import { MercadoPagoTokenResponse } from '@mp/domain/interfaces/mercado-pago.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaymentAccountService } from '@/payment-account/application/services/payment-account.service';

import { PkceUtils } from './pkce.utils';

@Injectable()
export class MercadoPagoService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly paymentAccountService: PaymentAccountService,
  ) {}

  generateLoginUrl(sellerId?: string): { url: string; codeVerifier: string } {
    const authApi = this.configService.get<string>('mercadoPago.authApi') || '';
    const clientId =
      this.configService.get<string>('mercadoPago.clientId') || '';
    const redirectUri =
      this.configService.get<string>('mercadoPago.redirectUri') || '';

    const state = sellerId || 'default';
    const codeVerifier = PkceUtils.generateCodeVerifier();
    const codeChallenge = PkceUtils.generateCodeChallenge(codeVerifier);

    const url = `${authApi}/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    return { url, codeVerifier };
  }

  async exchangeCodeForToken(
    code: string,
    userId: string,
    codeVerifier: string,
  ) {
    const mpApi = this.configService.get<string>('mercadoPago.mpApi') || '';
    const clientSecret = this.configService.get<string>(
      'mercadoPago.clientSecret',
    );
    const clientId = this.configService.get<string>('mercadoPago.clientId');
    const redirectUri = this.configService.get<string>(
      'mercadoPago.redirectUri',
    );

    if (!mpApi || !clientSecret || !clientId || !redirectUri) {
      throw new BadRequestException(
        'Missing required Mercado Pago configuration',
      );
    }

    const formData = new URLSearchParams({
      client_secret: clientSecret,
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    try {
      const response = await fetch(`${mpApi}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MercadoPago API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new BadRequestException(
          `MercadoPago API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as MercadoPagoTokenResponse;

      if (!data.access_token || !data.user_id) {
        throw new BadRequestException(
          'Invalid token response from Mercado Pago',
        );
      }

      await this.paymentAccountService.upsertPaymentAccount({
        userId,
        provider: 'mercadopago',
        mpUserId: data.user_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: BigInt(data.expires_in),
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new BadRequestException('Failed to exchange code for token');
    }
  }
}
