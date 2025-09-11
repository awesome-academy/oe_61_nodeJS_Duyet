import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTokenDto {
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  token: string;
}
