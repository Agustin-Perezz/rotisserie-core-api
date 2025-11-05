import { CreatePreferenceDto } from '@mp/application/dto/create-preference.dto';
import { ProcessPaymentDto } from '@mp/application/dto/process-payment.dto';
import { MercadoPagoService } from '@mp/application/services/mercado-pago.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('mp')
export class MpController {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {}

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
  async mpCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const [userId, codeVerifier] = decodeURIComponent(state).split(':');

    if (!codeVerifier) {
      throw new BadRequestException(
        'Invalid state parameter: missing code verifier',
      );
    }

    await this.mercadoPagoService.exchangeCodeForToken(
      code,
      userId,
      codeVerifier,
    );

    const redirectUrl =
      this.configService.get<string>('frontend.redirectUrl') || '';

    return res.redirect(redirectUrl);
  }

  @Get('public-key/:ownerId')
  async getSellerPublicKey(@Param('ownerId') ownerId: string) {
    const publicKey = await this.mercadoPagoService.getSellerPublicKey(ownerId);
    return { publicKey };
  }

  @Post('preference')
  async createPreference(@Body() body: CreatePreferenceDto) {
    return await this.mercadoPagoService.createPreference(body, body.ownerId);
  }

  @Post('process_payment')
  async processPayment(@Body() body: ProcessPaymentDto) {
    return await this.mercadoPagoService.processPayment(body, body.ownerId);
  }
}
