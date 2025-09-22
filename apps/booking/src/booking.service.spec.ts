/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Booking,
  BookingRoom,
  Invoice,
  Room,
  Service,
  BookingService as BookingServiceEntity,
} from '@app/database';
import { Repository } from 'typeorm';
import {
  CreateBookingDto,
  VnpayReturnDto,
  BookingStatus,
  InvoiceStatus,
  PaymentMethod,
  ListBookingDto,
} from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';
import { VnpayService } from '../../../libs/common/vnpay/vnpay.service';
import { Logger } from '@nestjs/common';

const mockQueryBuilder = {
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getOne: jest.fn().mockResolvedValue(undefined),
};

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let bookingRoomRepository: jest.Mocked<Repository<BookingRoom>>;
  let roomRepository: jest.Mocked<Repository<Room>>;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let vnpayService: jest.Mocked<VnpayService>;
  let i18nService: jest.Mocked<I18nService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            manager: { transaction: jest.fn() },
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BookingRoom),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Room),
          useValue: {
            findBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {
            findBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: VnpayService,
          useValue: {
            createPaymentUrl: jest.fn(),
            verifyReturnUrl: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
        {
          provide: 'BullQueue_emails',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    bookingRoomRepository = module.get(getRepositoryToken(BookingRoom));
    roomRepository = module.get(getRepositoryToken(Room));
    serviceRepository = module.get(getRepositoryToken(Service));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    vnpayService = module.get(VnpayService);
    i18nService = module.get(I18nService);
    jest.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((mockFn) => mockFn.mockClear());

    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    // Mock the system time to ensure tests are not time-dependent
    beforeAll(() => {
      jest.useFakeTimers();
      // Set a fixed "current time" that is before the booking start time
      jest.setSystemTime(new Date('2025-09-18T09:00:00Z'));
    });

    // Restore real timers after all tests in this block
    afterAll(() => {
      jest.useRealTimers();
    });

    const payload = {
      createBookingDto: {
        roomIds: [1],
        startTime: new Date('2025-09-18T10:00:00Z').toISOString(),
        endTime: new Date('2025-09-19T10:00:00Z').toISOString(),
        numAdults: 2,
        numChildren: 1,
        serviceIds: [1],
        quantities: [2],
        paymentMethod: PaymentMethod.CARD,
      } as CreateBookingDto,
      userId: 1,
      ipAddr: '127.0.0.1',
      lang: 'vi',
    };

    it('should create booking successfully', async () => {
      const rooms: Room[] = [{ id: 1, price: 1000 }] as Room[];
      const services: Service[] = [{ id: 1, price: 200 }] as Service[];
      const savedBooking: Booking = { id: 1, user_id: 1 } as Booking;

      const totalAmount =
        (rooms[0].price ?? 0) * 1 + (services[0].price ?? 0) * 2;

      const savedInvoice: Invoice = {
        id: 1,
        invoice_code: `INV-${Date.now()}-${savedBooking.id}`,
        total_amount: totalAmount,
        booking_id: 1,
        staff_id: 1,
        payment_method: PaymentMethod.CARD,
        status: InvoiceStatus.PENDING,
        issued_date: new Date(),
      } as Invoice;

      const paymentUrl = 'https://vnpay.com/payment';

      roomRepository.findBy.mockResolvedValue(rooms);
      serviceRepository.findBy.mockResolvedValue(services);
      bookingRoomRepository.count.mockResolvedValue(0);

      interface MockEntityManager {
        create: <T>(entityClass: new () => T, data?: Partial<T>) => T;
        save: <T>(entity: T) => Promise<T>;
      }

      (bookingRepository.manager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: MockEntityManager) => Promise<any>,
        ): Promise<any> => {
          const mockManager: MockEntityManager = {
            create: <T>(entityClass: new () => T) => {
              if (entityClass === Booking) return savedBooking as unknown as T;
              if (entityClass === Invoice) return savedInvoice as unknown as T;
              if (entityClass === BookingRoom)
                return {
                  booking_id: 1,
                  room_id: 1,
                  price_at_booking: 1000,
                } as unknown as T;
              if (entityClass === BookingServiceEntity)
                return {
                  booking_id: 1,
                  service_id: 1,
                  quantity: 2,
                  price_at_booking: 200,
                } as unknown as T;
              throw new Error('Unexpected entity type');
            },
            save: <T>(entity: T) => Promise.resolve(entity),
          };

          return callback(mockManager);
        },
      );

      vnpayService.createPaymentUrl.mockReturnValue(paymentUrl);

      const result = await service.createBooking(payload);

      expect(result.status).toBe('success');
      expect(result.message).toBe('booking.SUCCESS');
      expect(result.data.paymentUrl).toBe(paymentUrl);
      expect(bookingRepository.manager.transaction).toHaveBeenCalled();
      expect(vnpayService.createPaymentUrl).toHaveBeenCalledWith(
        '127.0.0.1',
        totalAmount,
        expect.stringMatching(/Payment-for-invoice-INV-\d+/),
        expect.stringMatching(/\d+-\d+/),
      );
    });

    it('should throw RpcException if start time is in the past', async () => {
      const pastPayload = {
        ...payload,
        createBookingDto: {
          ...payload.createBookingDto,
          // This startTime is now correctly evaluated against the mocked system time
          startTime: new Date('2025-09-18T08:00:00Z').toISOString(),
        },
      };

      await expect(service.createBooking(pastPayload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('booking.START_TIME_PAST', {
        lang: 'vi',
      });
    });

    it('should throw RpcException if no rooms provided', async () => {
      const invalidPayload = {
        ...payload,
        createBookingDto: { ...payload.createBookingDto, roomIds: [] },
      };
      await expect(service.createBooking(invalidPayload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('booking.ROOM_REQUIRED', {
        lang: 'vi',
      });
    });

    it('should throw RpcException if room not found', async () => {
      roomRepository.findBy.mockResolvedValue([] as Room[]);
      await expect(service.createBooking(payload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('booking.ROOM_NOT_FOUND', {
        lang: 'vi',
      });
    });

    it('should throw RpcException if room not available', async () => {
      roomRepository.findBy.mockResolvedValue([
        { id: 1, price: 1000 },
      ] as Room[]);
      serviceRepository.findBy.mockResolvedValue([
        { id: 1, price: 200 },
      ] as Service[]);
      bookingRoomRepository.count.mockResolvedValue(1);

      await expect(service.createBooking(payload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('booking.ROOM_NOT_AVAILABLE', {
        lang: 'vi',
      });
    });
  });

  describe('handleVnpayReturn', () => {
    // ... (This section remains unchanged)
    const vnpayReturnDto: VnpayReturnDto = {
      vnp_Amount: '1400',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: '123456',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Order 001',
      vnp_PayDate: '20250918103700',
      vnp_ResponseCode: '00',
      vnp_TmnCode: 'YOUR_TMN_CODE',
      vnp_TransactionNo: '789012',
      vnp_TxnRef: '1-12345678',
      vnp_SecureHash: 'some_hash_value',
      vnp_TransactionStatus: '00',
    };

    const mockInvoice: Invoice = {
      id: 1,
      booking: {
        id: 1,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
        status: BookingStatus.BOOKED,
      } as Booking,
      status: InvoiceStatus.PENDING,
      staff_id: 1,
    } as Invoice;

    it('should handle successful payment', async () => {
      vnpayService.verifyReturnUrl.mockReturnValue(true);
      mockQueryBuilder.getOne.mockResolvedValue(mockInvoice);

      const result = await service.handleVnpayReturn(vnpayReturnDto);

      expect(result.status).toBe('success');
      expect(result.message).toBe('booking.SUCCESS');
      expect(invoiceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.PAID }),
      );
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.BOOKED }),
      );
    });

    it('should handle failed payment when response code not "00"', async () => {
      vnpayService.verifyReturnUrl.mockReturnValue(true);
      mockQueryBuilder.getOne.mockResolvedValue(mockInvoice);

      const failedDto = { ...vnpayReturnDto, vnp_ResponseCode: '24' };
      const result = await service.handleVnpayReturn(failedDto);

      expect(result.status).toBe('failed');
      expect(result.message).toBe('booking.FAILED');
      expect(invoiceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.CANCELED }),
      );
    });

    it('should return error if signature invalid', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      vnpayService.verifyReturnUrl.mockReturnValue(false);
      const result = await service.handleVnpayReturn(vnpayReturnDto);

      expect(result.status).toBe('error');
      expect(result.message).toBe('booking.INVALID_SIGNATURE');
      expect(invoiceRepository.findOne).not.toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should return error if invoice not found', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      vnpayService.verifyReturnUrl.mockReturnValue(true);
      mockQueryBuilder.getOne.mockResolvedValue(undefined);

      const result = await service.handleVnpayReturn(vnpayReturnDto);

      expect(result.status).toBe('error');
      expect(result.message).toBe('booking.INVALID_SIGNATURE');
      loggerSpy.mockRestore();
    });
  });

  describe('BookingService - additional methods', () => {
    describe('listAllBookings', () => {
      it('should return paginated bookings with status and search filters', async () => {
        const mockBookings = [
          { id: 1, user: { name: 'Alice', email: 'alice@test.com' } },
          { id: 2, user: { name: 'Bob', email: 'bob@test.com' } },
        ] as Booking[];
        const listBookingDto = {
          status: BookingStatus.BOOKED,
        } as ListBookingDto;

        mockQueryBuilder.getManyAndCount.mockResolvedValue([
          mockBookings,
          mockBookings.length,
        ]);
        const result = await service.listAllBookings(listBookingDto);

        expect(result.data).toEqual(mockBookings);
        expect(result.meta.total).toBe(mockBookings.length);
      });

      it('should return default pagination if page/limit not provided', async () => {
        const mockBookings = [{ id: 1, user: { name: 'Alice' } }] as Booking[];
        mockQueryBuilder.getManyAndCount.mockResolvedValue([
          mockBookings,
          mockBookings.length,
        ]);

        const result = await service.listAllBookings({} as ListBookingDto);
        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(10);
      });
    });

    describe('getBookingsByUserId', () => {
      it('should return paginated bookings for a user', async () => {
        const mockBookings = [{ id: 1, user_id: 1 }] as Booking[];
        const listBookingDto = {
          status: BookingStatus.BOOKED,
        } as ListBookingDto;

        mockQueryBuilder.getManyAndCount.mockResolvedValue([
          mockBookings,
          mockBookings.length,
        ]);

        await service.getBookingsByUserId({ userId: 1, listBookingDto });

        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'booking.user_id = :userId',
          { userId: 1 },
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'booking.status = :status',
          { status: BookingStatus.BOOKED },
        );
      });

      it('should return default pagination if page/limit not provided', async () => {
        const mockBookings = [{ id: 1, user_id: 1 }] as Booking[];
        const listBookingDto = {} as ListBookingDto;

        mockQueryBuilder.getManyAndCount.mockResolvedValue([
          mockBookings,
          mockBookings.length,
        ]);

        const result = await service.getBookingsByUserId({
          userId: 1,
          listBookingDto,
        });

        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(10);
        expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
      });
    });

    describe('getBookingById', () => {
      it('should return booking if user is admin', async () => {
        const mockBooking = { id: 1, user_id: 2 } as Booking;
        mockQueryBuilder.getOne.mockResolvedValue(mockBooking);

        const result = await service.getBookingById({
          id: 1,
          userId: 99,
          userRole: 'admin',
          lang: 'vi',
        });

        expect(result).toEqual(mockBooking);
        expect(bookingRepository.createQueryBuilder).toHaveBeenCalledWith(
          'booking',
        );
      });

      it('should throw RpcException if booking not found', async () => {
        mockQueryBuilder.getOne.mockResolvedValue(undefined);
        await expect(
          service.getBookingById({
            id: 1,
            userId: 1,
            userRole: 'user',
            lang: 'vi',
          }),
        ).rejects.toThrow(RpcException);
      });

      it('should throw RpcException if user has no access', async () => {
        const mockBooking = { id: 1, user_id: 2 } as Booking;
        mockQueryBuilder.getOne.mockResolvedValue(mockBooking);

        await expect(
          service.getBookingById({
            id: 1,
            userId: 1,
            userRole: 'user',
            lang: 'vi',
          }),
        ).rejects.toThrow(RpcException);
      });
    });
  });
});
