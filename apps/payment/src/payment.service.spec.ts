/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { Invoice } from '@app/database';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListInvoiceDto, InvoiceStatus } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

describe('PaymentService', () => {
  let service: PaymentService;
  let invoiceRepository: Repository<Invoice>;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `Translated: ${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    invoiceRepository = module.get<Repository<Invoice>>(
      getRepositoryToken(Invoice),
    );
    i18nService = module.get<I18nService>(I18nService);
  });

  describe('listInvoices', () => {
    it('should return paginated invoices with search and status filters', async () => {
      const mockInvoices = [
        { id: 1, invoice_code: 'INV001' } as Invoice,
        { id: 2, invoice_code: 'INV002' } as Invoice,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvoices, 2]),
      } as unknown as SelectQueryBuilder<Invoice>;

      (invoiceRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const dto: ListInvoiceDto = {
        page: 1,
        limit: 2,
        search: 'INV001',
        status: InvoiceStatus.PAID,
      };
      const result = await service.listInvoices(dto);

      expect(result.data).toEqual(mockInvoices);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.last_page).toBe(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(invoiceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'invoice',
      );
    });

    it('should return default pagination if page/limit not provided', async () => {
      const mockInvoices = [{ id: 1, invoice_code: 'INV001' } as Invoice];

      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvoices, 1]),
      };

      (invoiceRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const dto: ListInvoiceDto = {};
      const result = await service.listInvoices(dto);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.last_page).toBe(1);
      expect(result.data).toEqual(mockInvoices);
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice if found', async () => {
      const mockInvoice = { id: 1, invoice_code: 'INV001' } as Invoice;
      (invoiceRepository.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(1, 'vi');

      expect(result).toEqual(mockInvoice);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'booking',
          'booking.user',
          'booking.bookingRooms',
          'booking.bookingRooms.room',
          'booking.bookingServices',
          'booking.bookingServices.service',
          'details',
          'promotion',
          'staff',
        ],
      });
    });

    it('should throw RpcException if invoice not found', async () => {
      (invoiceRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getInvoiceById(999, 'vi')).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('invoice.NOT_FOUND', {
        lang: 'vi',
        args: { id: 999 },
      });
    });
  });
});
