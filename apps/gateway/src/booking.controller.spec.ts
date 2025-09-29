/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { ClientProxy } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { Response, Request } from 'express';
import { JwtAuthGuard, ListBookingDto } from '@app/common';
import { CreateBookingDto, VnpayReturnDto, JwtPayload } from '@app/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('BookingController', () => {
  let controller: BookingController;
  let bookingClient: jest.Mocked<ClientProxy>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(async () => {
    bookingClient = { send: jest.fn() } as unknown as jest.Mocked<ClientProxy>;
    i18n = {
      t: jest.fn((key: string) => `translated_${key}`),
    } as unknown as jest.Mocked<I18nService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: 'BOOKING_SERVICE', useValue: bookingClient },
        { provide: ConfigService, useValue: {} },
        { provide: I18nService, useValue: i18n },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BookingController>(BookingController);
  });

  // --- listAllBookings ---
  describe('listAllBookings', () => {
    it('should call bookingClient.send with correct payload', () => {
      const dto = { page: 1 } as ListBookingDto;
      bookingClient.send.mockReturnValue(of({ data: [] }));
      controller.listAllBookings(dto);
      expect(bookingClient.send).toHaveBeenCalledWith(
        { cmd: 'list_all_bookings' },
        dto,
      );
    });
    describe('ListBookingDto validation', () => {
      it('should pass validation with no fields (use defaults)', async () => {
        const dto = plainToInstance(ListBookingDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
        expect(dto.page).toBeDefined();
        expect(dto.limit).toBeDefined();
      });

      it('should pass validation with all valid fields', async () => {
        const dto = plainToInstance(ListBookingDto, {
          page: 2,
          limit: 10,
          search: 'room 101',
          status: 1,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail if page is less than 1', async () => {
        const dto = plainToInstance(ListBookingDto, { page: 0 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'page')).toBe(true);
      });

      it('should fail if limit is greater than 100', async () => {
        const dto = plainToInstance(ListBookingDto, { limit: 101 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'limit')).toBe(true);
      });

      it('should fail if limit is less than 1', async () => {
        const dto = plainToInstance(ListBookingDto, { limit: 0 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'limit')).toBe(true);
      });

      it('should fail if search is not string', async () => {
        const dto = plainToInstance(ListBookingDto, {
          search: 123 as unknown as string,
        });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'search')).toBe(true);
      });

      it('should fail if status is not a valid enum', async () => {
        const dto = plainToInstance(ListBookingDto, {
          status: 'invalid' as unknown as number,
        });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'status')).toBe(true);
      });
    });
  });

  // --- getMyBookings ---
  describe('getMyBookings', () => {
    it('should call bookingClient.send with userId and lang', () => {
      const dto = {} as ListBookingDto;
      const user: JwtPayload = { sub: 123 } as JwtPayload;
      bookingClient.send.mockReturnValue(of({ data: [] }));

      controller.getMyBookings(dto, user);

      expect(bookingClient.send).toHaveBeenCalledWith(
        { cmd: 'get_bookings_by_user' },
        expect.objectContaining({
          userId: 123,
          listBookingDto: dto,
          lang: 'vi',
        }),
      );
    });
    it('should pass validation with no fields (use defaults)', async () => {
      const dto = plainToInstance(ListBookingDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.page).toBeDefined();
      expect(dto.limit).toBeDefined();
    });

    it('should pass validation with all valid fields', async () => {
      const dto = plainToInstance(ListBookingDto, {
        page: 2,
        limit: 10,
        search: 'room 101',
        status: 1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if page < 1', async () => {
      const dto = plainToInstance(ListBookingDto, { page: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('should fail if limit < 1', async () => {
      const dto = plainToInstance(ListBookingDto, { limit: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });

    it('should fail if limit > 100', async () => {
      const dto = plainToInstance(ListBookingDto, { limit: 101 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });

    it('should fail if search is not string', async () => {
      const dto = plainToInstance(ListBookingDto, {
        search: 123 as unknown as string,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'search')).toBe(true);
    });

    it('should fail if status is invalid', async () => {
      const dto = plainToInstance(ListBookingDto, {
        status: 'INVALID' as unknown as number,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });
  });

  // --- getBookingById ---
  describe('getBookingById', () => {
    it('should call bookingClient.send with id, userId, userRole, and lang', () => {
      const user: JwtPayload = { sub: 123, role: 'admin' } as JwtPayload;
      bookingClient.send.mockReturnValue(of({ data: {} }));

      controller.getBookingById(10, user);

      expect(bookingClient.send).toHaveBeenCalledWith(
        { cmd: 'get_booking_by_id' },
        expect.objectContaining({
          id: 10,
          userId: 123,
          userRole: 'admin',
          lang: 'vi',
        }),
      );
    });
  });

  describe('createBooking', () => {
    it('should call bookingClient.send and return result', async () => {
      const mockDto: CreateBookingDto = {
        roomIds: [1],
        startTime: '2025-09-18T10:00:00Z',
        endTime: '2025-09-18T12:00:00Z',
        numAdults: 2,
      } as CreateBookingDto;
      const mockUser: JwtPayload = { sub: 123 } as JwtPayload;
      const mockReq = {
        headers: {},
        ip: '::1',
        socket: { remoteAddress: undefined },
      } as Request;
      const expectedResult = { status: 'success', data: { id: 1 } };

      bookingClient.send.mockReturnValue(of(expectedResult));

      const result = await controller.createBooking(mockDto, mockReq, mockUser);

      expect(result).toEqual(expectedResult);
      expect(bookingClient.send).toHaveBeenCalledWith(
        { cmd: 'create_booking' },
        expect.objectContaining({
          createBookingDto: mockDto,
          userId: 123,
          ipAddr: '127.0.0.1',
          lang: 'vi',
        }),
      );
    });
  });

  describe('handleVnpayReturn', () => {
    it('should handle success response', async () => {
      const mockDto: VnpayReturnDto = { vnp_TxnRef: '123' } as VnpayReturnDto;
      const serviceResponse = {
        status: 'success',
        data: 'ok',
        message: 'Thanh cong',
      };
      bookingClient.send.mockReturnValue(of(serviceResponse));
      const result = await controller.handleVnpayReturn(mockDto);
      expect(result.status).toBe('success');
      expect(result.data).toBe('ok');
    });

    it('should handle failed response', async () => {
      const mockDto: VnpayReturnDto = {
        vnp_TxnRef: '123',
        vnp_ResponseCode: '24',
      } as VnpayReturnDto;
      const serviceResponse = { status: 'failed' };
      bookingClient.send.mockReturnValue(of(serviceResponse));
      const result = await controller.handleVnpayReturn(mockDto);
      expect(result.status).toBe('failed');
      expect(result.data).toHaveProperty('txnRef', '123');
    });

    it('should handle unknown response', async () => {
      const mockDto: VnpayReturnDto = { vnp_TxnRef: '123' } as VnpayReturnDto;
      const serviceResponse = { status: 'weird' };
      bookingClient.send.mockReturnValue(of(serviceResponse));
      const result = await controller.handleVnpayReturn(mockDto);
      expect(result.status).toBe('error');
      expect(result.message).toBe('translated_booking.INVALID_SIGNATURE');
    });

    it('should handle exception thrown by bookingClient', async () => {
      const mockDto: VnpayReturnDto = { vnp_TxnRef: '123' } as VnpayReturnDto;
      bookingClient.send.mockReturnValue(throwError(() => new Error('boom')));
      const result = await controller.handleVnpayReturn(mockDto);
      expect(result.status).toBe('error');
      expect(result.message).toBe('translated_booking.INVALID_SIGNATURE');
      expect(result.data).toHaveProperty('error', 'boom');
    });
  });
});
