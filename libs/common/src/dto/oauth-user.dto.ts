import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class OAuthUserDto {
  @IsEmail({}, { message: 'validation.IS_EMAIL' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MaxLength(100)
  name: string;

  @IsUrl({}, { message: 'validation.IS_URL' })
  @IsOptional() // Avatar is optional
  avatar: string | null;
}
