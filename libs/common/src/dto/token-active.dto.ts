import { IsNotEmpty, IsUUID } from 'class-validator';

export class ActiveUserDto {
  @IsUUID(4, { message: 'validation.IS_UUID' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  verification_token: string;
}
