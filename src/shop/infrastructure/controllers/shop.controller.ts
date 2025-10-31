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

@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.shopService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.shopService.findByName(name);
  }

  @UseGuards(AuthGuard)
  @Get('owner/:ownerId')
  findByOwnerId(@Param('ownerId') ownerId: string) {
    return this.shopService.findByOwnerId(ownerId);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() shop: CreateShopDto, @UserId() userId: string) {
    shop.ownerId = userId;
    return this.shopService.create(shop);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() shop: UpdateShopDto) {
    return this.shopService.update(id, shop);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shopService.delete(id);
  }
}
