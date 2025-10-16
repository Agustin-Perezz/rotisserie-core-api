import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';
import { ItemService } from '../../application/services/item.service';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.itemService.create(createItemDto, file);
  }

  @Get()
  findAll(@Query('shopId') shopId?: string) {
    if (shopId) {
      return this.itemService.findByShopId(shopId);
    }
    return this.itemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemService.findById(id);
  }

  @Get('shop/:shopName')
  findByShopName(@Param('shopName') shopName: string) {
    return this.itemService.findByShopName(shopName);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.itemService.update(id, updateItemDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemService.delete(id);
  }
}
