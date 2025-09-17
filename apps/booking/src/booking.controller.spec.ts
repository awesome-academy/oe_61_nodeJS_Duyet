/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { ListBookingDto, VnpayReturnDto } from '@app/common';
import { CreateBookingDto } from '@app/common/dto/create-booking.dto';

describe('BookingController', () => {
  let bookingController: BookingController;
  let bookingService: BookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: {
            createBooking: jest.fn(),
            handleVnpayReturn: jest.fn(),
            listAllBookings: jest.fn(),
            getBookingById: jest.fn(),
            getBookingsByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    bookingController = module.get<BookingController>(BookingController);
    bookingService = module.get<BookingService>(BookingService);
  });

  describe('createBooking', () => {
    it('should call bookingService.createBooking with correct payload', () => {
      const payload = {
        createBookingDto: {
          roomIds: [1],
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          numAdults: 2,
          serviceIds: [],
          quantities: [],
          paymentMethod: 1,
        } as CreateBookingDto,
        userId: 1,
        ipAddr: '127.0.0.1',
        lang: 'vi',
      };

      const result = {
        status: 'success',
        message: 'Booking created',
        data: {},
      };
      (bookingService.createBooking as jest.Mock).mockReturnValue(result);

      expect(bookingController.createBooking(payload)).toBe(result);
      expect(bookingService.createBooking).toHaveBeenCalledWith(payload);
    });
  });

  describe('handleVnpayReturn', () => {
    it('should call bookingService.handleVnpayReturn with correct dto', () => {
      const vnpayReturnDto: VnpayReturnDto = {
        vnp_Amount: '230000000',
        vnp_BankCode: 'NCB',
        vnp_BankTranNo: '123456',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: 'Order 001',
        vnp_PayDate: '20250918103700',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'YOUR_TMN_CODE',
        vnp_TransactionNo: '789012',
        vnp_TxnRef: 'TXN001',
        vnp_SecureHash: 'some_hash_value',
        vnp_TransactionStatus: '00',
      };

      const result = {
        status: 'success',
        message: 'Payment successful',
        data: {},
      };
      (bookingService.handleVnpayReturn as jest.Mock).mockReturnValue(result);

      expect(bookingController.handleVnpayReturn(vnpayReturnDto)).toBe(result);
      expect(bookingService.handleVnpayReturn).toHaveBeenCalledWith(
        vnpayReturnDto,
      );
    });
  });

  describe('listAllBookings', () => {
    it('should call bookingService.listAllBookings with correct dto', () => {
      const listBookingDto: ListBookingDto = {
        page: 1,
        limit: 5,
      } as ListBookingDto;
      const result = {
        data: [],
        meta: { total: 0, page: 1, limit: 5, last_page: 1 },
      };
      (bookingService.listAllBookings as jest.Mock).mockReturnValue(result);

      expect(bookingController.listAllBookings(listBookingDto)).toBe(result);
      expect(bookingService.listAllBookings).toHaveBeenCalledWith(
        listBookingDto,
      );
    });
  });

  describe('getBookingById', () => {
    it('should call bookingService.getBookingById with correct payload', () => {
      const payload = { id: 1, userId: 2, userRole: 'admin', lang: 'vi' };
      const result = { id: 1, user_id: 2 };
      (bookingService.getBookingById as jest.Mock).mockReturnValue(result);

      expect(bookingController.getBookingById(payload)).toBe(result);
      expect(bookingService.getBookingById).toHaveBeenCalledWith(payload);
    });
  });

  describe('getBookingsByUser', () => {
    it('should call bookingService.getBookingsByUserId with correct payload', () => {
      const payload = {
        userId: 2,
        listBookingDto: { page: 1 } as ListBookingDto,
        lang: 'vi',
      };
      const result = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, last_page: 1 },
      };
      (bookingService.getBookingsByUserId as jest.Mock).mockReturnValue(result);

      expect(bookingController.getBookingsByUser(payload)).toBe(result);
      expect(bookingService.getBookingsByUserId).toHaveBeenCalledWith(payload);
    });
  });
});
