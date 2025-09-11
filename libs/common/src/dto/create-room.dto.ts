import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  room_number: string;

  @Type(() => Number)
  @IsInt({ message: 'validation.IS_INT' })
  @Min(1, { message: 'validation.MIN' })
  bed_number: number;

  @Transform(({ value }: { value: string }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'validation.IS_BOOLEAN' })
  air_conditioned: boolean;

  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  view: string;

  @Type(() => Number)
  @IsInt({ message: 'validation.IS_INT' })
  room_type_id: number;

  @IsString({ message: 'validation.IS_STRING' })
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'validation.IS_NUMBER' })
  @Min(0, { message: 'validation.MIN' })
  price: number;
}
