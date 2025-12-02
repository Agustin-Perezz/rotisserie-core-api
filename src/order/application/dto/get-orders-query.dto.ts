import { IsDateString, IsOptional } from 'class-validator';

export class GetOrdersQueryDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
