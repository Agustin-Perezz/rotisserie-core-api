import { Injectable, NotFoundException } from '@nestjs/common';

import { FirebaseService } from '../../../firebase/application/services/firebase.service';
import { ItemRepository } from '../../infrastructure/persistence/item.repository';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(createItemDto: CreateItemDto, file?: Express.Multer.File) {
    if (file) {
      const imageUrl = await this.firebaseService.uploadFile(file, 'items');
      createItemDto.image = imageUrl;
    }
    return this.itemRepository.create(createItemDto);
  }

  async findAll() {
    return this.itemRepository.findAll();
  }

  async findById(id: string) {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async findByShopId(shopId: string) {
    return this.itemRepository.findByShopId(shopId);
  }

  async findByShopName(shopName: string) {
    return this.itemRepository.findByShopName(shopName);
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    file?: Express.Multer.File,
  ) {
    const currentItem = await this.findById(id);

    if (file) {
      if (currentItem.image) {
        await this.firebaseService.deleteFile(currentItem.image);
      }
      const imageUrl = await this.firebaseService.uploadFile(file, 'items');
      updateItemDto.image = imageUrl;
    }

    return this.itemRepository.update(id, updateItemDto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.itemRepository.delete(id);
  }
}
