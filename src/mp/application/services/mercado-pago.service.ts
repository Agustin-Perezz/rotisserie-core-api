import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class MercadoPagoService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  generateLoginUrl(sellerId?: string): { url: string } {
    const authApi = this.configService.get<string>('mercadoPago.authApi') || '';
    const clientId =
      this.configService.get<string>('mercadoPago.clientId') || '';
    const redirectUri =
      this.configService.get<string>('mercadoPago.redirectUri') || '';

    const state = sellerId || 'default';

    const url = `${authApi}/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${state}`;

    return { url };
  }
}
