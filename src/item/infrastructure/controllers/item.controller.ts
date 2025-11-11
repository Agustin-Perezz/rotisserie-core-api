import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { imagesUploadInterceptor } from '../../../common/interceptors/images-upload.interceptor';
import { CreateItemDto } from '../../application/dto/create-item.dto';
import { UpdateItemDto } from '../../application/dto/update-item.dto';
import { ItemService } from '../../application/services/item.service';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseInterceptors(imagesUploadInterceptor('images', 3))
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.itemService.create(createItemDto, files);
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
  @UseInterceptors(imagesUploadInterceptor('images', 3))
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.itemService.update(id, updateItemDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemService.delete(id);
  }

  @Delete(':id/images')
  removeImage(@Param('id') id: string, @Query('imageId') imageId: string) {
    return this.itemService.deleteImage(id, imageId);
  }
}
