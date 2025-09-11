import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  token: string;

  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MinLength(6, { message: 'validation.MIN_LENGTH' })
  @MaxLength(128, { message: 'validation.MAX_LENGTH' })
  password: string;
}
