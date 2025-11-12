import { Injectable, NotFoundException } from '@nestjs/common';

import { ItemWithImages } from '@/item/domain/interfaces/item-repository.interface';

import { FirebaseService } from '../../../firebase/application/services/firebase.service';
import { ItemRepository } from '../../infrastructure/persistence/item.repository';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Injectable()
export class ItemService {
  private static readonly IMAGES_FOLDER = 'items';

  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(createItemDto: CreateItemDto, files?: Express.Multer.File[]) {
    if (files?.length) {
      createItemDto.images = await this.firebaseService.uploadFiles(
        files,
        ItemService.IMAGES_FOLDER,
      );
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
    files?: Express.Multer.File[],
  ) {
    await this.findById(id);

    if (files?.length) {
      updateItemDto.images = await this.firebaseService.uploadFiles(
        files,
        ItemService.IMAGES_FOLDER,
      );
    }

    return this.itemRepository.update(id, updateItemDto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.itemRepository.delete(id);
  }

  async deleteImage(itemId: string, imageUrl: string) {
    const item = await this.findById(itemId);
    const image = this.matchImageUrlOrThrowError(item, imageUrl);

    await this.firebaseService.deleteFile(image.url);
    return this.itemRepository.deleteImage(image.id);
  }

  private matchImageUrlOrThrowError(item: ItemWithImages, imageUrl: string) {
    const image = item.images.find((img) => img.url === imageUrl);

    if (!image) {
      throw new NotFoundException(
        `Image with URL ${imageUrl} not found for item ${item.id}`,
      );
    }

    return image;
  }
}
