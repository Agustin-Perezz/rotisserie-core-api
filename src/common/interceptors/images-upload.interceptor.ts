import { NestInterceptor } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export function imagesUploadInterceptor(
  fieldName: string = 'images',
  maxCount: number = 3,
  maxFileSizeMB: number = 5,
): NestInterceptor {
  return FilesInterceptor(fieldName, maxCount, {
    storage: memoryStorage(),
    limits: { fileSize: 1024 * 1024 * maxFileSizeMB },
  }) as unknown as NestInterceptor;
}
