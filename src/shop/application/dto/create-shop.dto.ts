import { IsOptional, IsString } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  location: string;

  @IsString()
  ownerId: string;
}
