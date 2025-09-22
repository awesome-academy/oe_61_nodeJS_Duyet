import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookingService } from './booking.service';
import { ListBookingDto, VnpayReturnDto } from '@app/common';
import { CreateBookingDto } from '@app/common/dto/create-booking.dto';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern({ cmd: 'create_booking' })
  createBooking(
    @Payload()
    payload: {
      createBookingDto: CreateBookingDto;
      userId: number;
      ipAddr: string;
      lang: string;
    },
  ) {
    return this.bookingService.createBooking(payload);
  }

  @MessagePattern({ cmd: 'vnpay_return' })
  handleVnpayReturn(@Payload() vnpayReturnDto: VnpayReturnDto) {
    return this.bookingService.handleVnpayReturn(vnpayReturnDto);
  }

  @MessagePattern({ cmd: 'list_all_bookings' })
  listAllBookings(@Payload() listBookingDto: ListBookingDto) {
    return this.bookingService.listAllBookings(listBookingDto);
  }

  @MessagePattern({ cmd: 'get_booking_by_id' })
  getBookingById(
    @Payload()
    payload: {
      id: number;
      userId: number;
      userRole: string;
      lang: string;
    },
  ) {
    return this.bookingService.getBookingById(payload);
  }

  @MessagePattern({ cmd: 'get_bookings_by_user' })
  getBookingsByUser(
    @Payload()
    payload: {
      userId: number;
      listBookingDto: ListBookingDto;
      lang: string;
    },
  ) {
    return this.bookingService.getBookingsByUserId(payload);
  }
}
