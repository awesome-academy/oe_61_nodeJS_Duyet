import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty({ example: 'success', description: 'Response status' })
  status: 'success' | 'failed' | 'error';

  @ApiProperty({ example: 'Booking created successfully', required: false })
  message?: string;

  @ApiProperty({
    description: 'Response data (can be any type)',
    required: false,
  })
  data?: T | null;

  constructor(
    status: 'success' | 'failed' | 'error',
    message?: string,
    data?: T | null,
  ) {
    this.status = status;
    this.message = message;
    this.data = data ?? null;
  }
}
