import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  name: string;

  @IsString({ message: 'validation.IS_STRING' })
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'validation.IS_NUMBER' })
  @Min(0, { message: 'validation.MIN' })
  price: number;

  @Type(() => Boolean)
  @IsBoolean({ message: 'validation.IS_BOOLEAN' })
  @IsOptional()
  is_active?: boolean = true;
}
