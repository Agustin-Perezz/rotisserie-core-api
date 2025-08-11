import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { UserId } from '@/auth/infrastructure/decorators/user.decorator';
import { AuthGuard } from '@/auth/infrastructure/guard/auth.guard';

import { CreateShopDto } from '../../application/dto/create-shop.dto';
import { UpdateShopDto } from '../../application/dto/update-shop.dto';
import { ShopService } from '../../application/services/shop.service';

@UseGuards(AuthGuard)
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  findAll() {
    return this.shopService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.shopService.findByOwner(ownerId);
  }

  @Post()
  create(@Body() shop: CreateShopDto, @UserId() userId: string) {
    shop.ownerId = userId;
    return this.shopService.create(shop);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() shop: UpdateShopDto) {
    return this.shopService.update(id, shop);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shopService.delete(id);
  }
}
