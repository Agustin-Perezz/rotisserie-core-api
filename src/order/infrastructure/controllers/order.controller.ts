import { AuthGuard } from '@auth/infrastructure/guard/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { GetOrdersQueryDto } from '../../application/dto/get-orders-query.dto';
import { UpdateOrderDto } from '../../application/dto/update-order.dto';
import { OrderService } from '../../application/services/order.service';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get('shop/:shopId')
  findByShopId(
    @Param('shopId') shopId: string,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
  ) {
    return this.orderService.findByShopId(shopId, status);
  }

  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
    @Query() query: GetOrdersQueryDto,
  ) {
    return this.orderService.findByUserId(userId, query.createdAt);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.delete(id);
  }
}
