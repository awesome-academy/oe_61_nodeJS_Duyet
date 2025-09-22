/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invoice } from '@app/database';
import { Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { ListInvoiceDto, InvoiceStatus } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

describe('PaymentService', () => {
  let service: PaymentService;
  let i18nService: jest.Mocked<I18nService>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: createMock<Repository<Invoice>>({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          }),
        },
        {
          provide: I18nService,
          useValue: createMock<I18nService>(),
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for listInvoices ---
  describe('listInvoices', () => {
    it('should return invoices without search or status filters', async () => {
      const dto: ListInvoiceDto = {};
      const mockData = [{ id: 1, invoice_code: 'INV001' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.listInvoices(dto);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10); // Default LIMIT
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      });
    });

    it('should apply pagination with default values if not provided', async () => {
      const dto: ListInvoiceDto = {};
      const mockData = [{ id: 1, invoice_code: 'INV001' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.listInvoices(dto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10); // Default LIMIT
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      });
    });

    it('should apply search filter and pagination', async () => {
      const dto: ListInvoiceDto = { page: 2, limit: 15, search: 'test' };
      const mockData = [{ id: 1, invoice_code: 'INV001' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.listInvoices(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(invoice.invoice_code LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(15); // (2-1) * 15
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 2, limit: 15, last_page: 1 },
      });
    });

    it('should apply status filter', async () => {
      const dto: ListInvoiceDto = { status: InvoiceStatus.PAID };
      const mockData = [
        { id: 1, invoice_code: 'INV001', status: InvoiceStatus.PAID },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.listInvoices(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invoice.status = :status',
        { status: InvoiceStatus.PAID },
      );
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      });
    });

    it('should apply both search and status filters', async () => {
      const dto: ListInvoiceDto = {
        page: 1,
        limit: 10,
        search: 'test',
        status: InvoiceStatus.PAID,
      };
      const mockData = [
        { id: 1, invoice_code: 'INV001', status: InvoiceStatus.PAID },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.listInvoices(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(invoice.invoice_code LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
        { search: '%test%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invoice.status = :status',
        { status: InvoiceStatus.PAID },
      );
      expect(result).toEqual({
        data: mockData,
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      });
    });
  });

  // --- Test Suite for getInvoiceById ---
  describe('getInvoiceById', () => {
    it('should return an invoice with related entities', async () => {
      const invoiceId = 1;
      const lang = 'en';
      const mockInvoice = {
        id: invoiceId,
        invoice_code: 'INV001',
        booking: {
          id: 1,
          user: { id: 1, name: 'User', email: 'user@example.com' },
        },
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(invoiceId, lang);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('invoice.id = :id', {
        id: invoiceId,
      });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(7); // Updated to 7
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'booking.user',
        'user',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'invoice.staff',
        'staff',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockInvoice);
    });

    it('should throw an RpcException if the invoice is not found', async () => {
      const invoiceId = 1;
      const lang = 'en';
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getInvoiceById(invoiceId, lang)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('invoice.NOT_FOUND', {
        lang,
        args: { id: invoiceId },
      });
    });

    it('should return invoice with null relations', async () => {
      const invoiceId = 2;
      const lang = 'en';
      const mockInvoiceWithNulls = {
        id: invoiceId,
        invoice_code: 'INV002',
        booking: {
          id: 2,
          user: { id: 2, name: 'Test User', email: 'test@example.com' },
          bookingRooms: [], // Empty array
          bookingServices: [], // Empty array
        },
        promotion: null, // Null relation
        staff: null, // Null relation
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockInvoiceWithNulls);

      const result = await service.getInvoiceById(invoiceId, lang);
      expect(result).toEqual(mockInvoiceWithNulls);
    });

    it('should throw an error on DB failure', async () => {
      const invoiceId = 3;
      const lang = 'en';
      mockQueryBuilder.getOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.getInvoiceById(invoiceId, lang)).rejects.toThrow(
        Error,
      );
    });
  });
});
