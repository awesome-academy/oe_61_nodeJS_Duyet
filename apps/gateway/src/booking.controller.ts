import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  JwtAuthGuard,
  ListBookingDto,
  ResponseDto,
  Roles,
  VnpayReturnDto,
} from '@app/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CreateBookingDto } from '@app/common/dto/create-booking.dto';
import { User } from '@app/common/decorators/user.decorator';
import { I18nContext, I18nService } from 'nestjs-i18n';
import {
  JwtPayload,
  MicroserviceResponse,
} from '@app/common/constants/database.constants';
import { ParseId } from '@app/common/decorators/parse-id.decorator';
import { getClientIp } from '../../../libs/utils/ip.util';
import { Public } from '@app/common/decorators/public.decorator';

@Controller('bookings')
export class BookingController {
  constructor(
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  @Roles('admin', 'staff')
  listAllBookings(@Query() listBookingDto: ListBookingDto) {
    return this.bookingClient.send(
      { cmd: 'list_all_bookings' },
      listBookingDto,
    );
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  getMyBookings(
    @Query() listBookingDto: ListBookingDto,
    @User() user: JwtPayload,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.bookingClient.send(
      { cmd: 'get_bookings_by_user' },
      { userId: user.sub, listBookingDto, lang },
    );
  }

  @Get(':id/detail')
  @UseGuards(JwtAuthGuard)
  getBookingById(@ParseId('id') id: number, @User() user: JwtPayload) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.bookingClient.send(
      { cmd: 'get_booking_by_id' },
      { id, userId: user.sub, userRole: user.role, lang },
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: Request,
    @User() user: JwtPayload,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    const ipAddr = getClientIp(req);
    const result = await firstValueFrom<MicroserviceResponse>(
      this.bookingClient.send(
        { cmd: 'create_booking' },
        { createBookingDto, userId: user.sub, ipAddr, lang },
      ),
    );
    return result;
  }

  @Get('vnpay_return')
  @Public()
  async handleVnpayReturn(
    @Query() vnpayReturnDto: VnpayReturnDto,
    @Res() res: Response,
  ) {
    try {
      const lang = 'vi';
      const result = await firstValueFrom<MicroserviceResponse>(
        this.bookingClient.send({ cmd: 'vnpay_return' }, vnpayReturnDto),
      );

      if (result.status === 'success') {
        return res.json({
          status: result.status,
          message: result.message || this.i18n.t('booking.SUCCESS', { lang }),
          data: (result.data as string) || null,
        });
      } else if (result.status === 'failed' || result.status === 'error') {
        return res.json({
          status: result.status,
          message: result.message || this.i18n.t('booking.FAILED', { lang }),
          data: (result.data as string) || {
            txnRef: vnpayReturnDto.vnp_TxnRef,
            responseCode: vnpayReturnDto.vnp_ResponseCode,
          },
        });
      } else {
        return new ResponseDto(
          'error',
          this.i18n.t('booking.INVALID_SIGNATURE', { lang }),
          null,
        );
      }
    } catch (error) {
      const lang = 'vi';
      return new ResponseDto(
        'error',
        this.i18n.t('booking.INVALID_SIGNATURE', { lang }),
        { error: (error as Error).message },
      );
    }
  }
}
