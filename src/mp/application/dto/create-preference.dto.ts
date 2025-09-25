import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PreferenceItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  unit_price: number;

  @IsOptional()
  @IsString()
  currency_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  picture_url?: string;
}

export class BackUrlsDto {
  @IsOptional()
  @IsString()
  success?: string;

  @IsOptional()
  @IsString()
  failure?: string;

  @IsOptional()
  @IsString()
  pending?: string;
}

export class CreatePreferenceDto {
  @IsOptional()
  @IsIn(['wallet_purchase', 'onboarding_credits'])
  purpose?: 'wallet_purchase' | 'onboarding_credits';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  items: PreferenceItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BackUrlsDto)
  back_urls?: BackUrlsDto;

  @IsOptional()
  @IsString()
  external_reference?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
