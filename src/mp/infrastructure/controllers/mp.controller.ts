import { MercadoPagoService } from '@mp/application/services/mercado-pago.service';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('mp')
export class MpController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Get('login')
  mpLogin(@Query('sellerId') sellerId: string) {
    const result = this.mercadoPagoService.generateLoginUrl(sellerId);

    const stateWithVerifier = `${sellerId || 'default'}:${result.codeVerifier}`;

    return {
      url: result.url.replace(
        /state=[^&]*/,
        `state=${encodeURIComponent(stateWithVerifier)}`,
      ),
      codeVerifier: result.codeVerifier,
    };
  }

  @Get('callback')
  async mpCallback(@Query('code') code: string, @Query('state') state: string) {
    const [userId, codeVerifier] = decodeURIComponent(state).split(':');

    if (!codeVerifier) {
      throw new Error('Invalid state parameter: missing code verifier');
    }

    const data = await this.mercadoPagoService.exchangeCodeForToken(
      code,
      userId,
      codeVerifier,
    );

    return {
      message: `User ${userId} connected to Mercado Pago`,
      data,
    };
  }
}
