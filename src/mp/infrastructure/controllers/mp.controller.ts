import { CreatePreferenceDto } from '@mp/application/dto/create-preference.dto';
import { ProcessPaymentDto } from '@mp/application/dto/process-payment.dto';
import { MercadoPagoService } from '@mp/application/services/mercado-pago.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

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
      throw new BadRequestException(
        'Invalid state parameter: missing code verifier',
      );
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

  @Post('preference')
  async createPreference(@Body() body: CreatePreferenceDto) {
    return await this.mercadoPagoService.createPreference(body);
  }

  @Post('process_payment')
  async processPayment(@Body() body: ProcessPaymentDto) {
    return await this.mercadoPagoService.processPayment(body);
  }
}
