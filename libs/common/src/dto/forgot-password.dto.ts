import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'validation.IS_EMAIL' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  email: string;
}
