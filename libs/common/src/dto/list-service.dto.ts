import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LIMIT, PAGE } from '../constants/database.constants';

export class ListServiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = LIMIT;

  @IsOptional()
  @IsString({ message: 'validation.IS_STRING' })
  @MaxLength(100, { message: 'validation.MAX_LENGTH' })
  search?: string;
}
