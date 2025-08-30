import { MercadoPagoService } from '@mp/application/services/mercado-pago.service';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('mp')
export class MpController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Get('login')
  mpLogin(@Query('sellerId') sellerId: string) {
    return this.mercadoPagoService.generateLoginUrl(sellerId);
  }
}
