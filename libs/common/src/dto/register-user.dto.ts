import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MaxLength(100, { message: 'validation.MAX_LENGTH' })
  name: string;

  @IsEmail({}, { message: 'validation.IS_EMAIL' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MaxLength(255, { message: 'validation.MAX_LENGTH' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MinLength(6, { message: 'validation.MIN_LENGTH' })
  @MaxLength(128, { message: 'validation.MAX_LENGTH' })
  password: string;
}

