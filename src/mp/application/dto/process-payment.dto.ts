import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PayerIdentificationDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  number: string;
}

export class PayerDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PayerIdentificationDto)
  identification: PayerIdentificationDto;
}

export class PaymentFormDataDto {
  @IsNotEmpty()
  @IsNumber()
  transaction_amount: number;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsNumber()
  installments: number;

  @IsNotEmpty()
  @IsString()
  payment_method_id: string;

  @IsNotEmpty()
  @IsString()
  issuer_id: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;
}

export class ProcessPaymentDto {
  @IsNotEmpty()
  @IsString()
  ownerId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PaymentFormDataDto)
  formData: PaymentFormDataDto;
}
