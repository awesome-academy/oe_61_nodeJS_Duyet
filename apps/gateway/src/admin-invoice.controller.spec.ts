import { Test, TestingModule } from '@nestjs/testing';
import { AdminInvoiceController } from './admin-invoice.controller';
import { of, throwError, Observable, firstValueFrom } from 'rxjs';
import {
  ListInvoiceDto,
  JwtAuthGuard,
  RolesGuard,
  InvoiceStatus,
} from '@app/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { RpcException } from '@nestjs/microservices';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LIMIT, PAGE } from '@app/common/constants/database.constants';

// Define a type for raw input to simulate query params
interface RawListInvoiceDto {
  page?: string | number;
  limit?: string | number;
  search?: any; // Allow any type for search to test validation
  status?: string | InvoiceStatus;
}

// Mock dependencies
const mockPaymentClient = { send: jest.fn() };
const mockI18nService = { t: jest.fn((key: string) => key) };

// Mock I18nContext globally
jest.mock('nestjs-i18n', () => ({
  I18nModule: { forRoot: jest.fn() },
  I18nService: jest.fn().mockImplementation(() => mockI18nService),
  I18nContext: { current: jest.fn(() => ({ lang: 'vi' })) },
}));

// Helper function to create DTO instances
const createDto = <T>(
  dtoClass: new () => T,
  data: RawListInvoiceDto | Partial<T>,
  options = { enableImplicitConversion: true },
): T => plainToInstance(dtoClass, data, options);

describe('AdminInvoiceController', () => {
  let controller: AdminInvoiceController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminInvoiceController],
      providers: [
        { provide: 'PAYMENT_SERVICE', useValue: mockPaymentClient },
        { provide: I18nService, useValue: mockI18nService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminInvoiceController>(AdminInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listInvoices', () => {
    it('should call paymentClient.send and return response', async () => {
      const dto: ListInvoiceDto = {
        page: 1,
        limit: 10,
        search: 'hóa đơn',
        status: InvoiceStatus.PAID,
      };
      const response = {
        data: [{ id: 1, amount: 1000, status: InvoiceStatus.PAID }],
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      };
      mockPaymentClient.send.mockReturnValue(of(response));

      const result = await firstValueFrom(
        controller.listInvoices(dto) as Observable<typeof response>,
      );

      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'list_invoices' },
        dto,
      );
      expect(result).toEqual(response);
    });

    it('should handle string inputs for page, limit, and status correctly', async () => {
      const input: RawListInvoiceDto = {
        page: '1',
        limit: '10',
        search: 'hóa đơn',
        status: '2', // Numeric string for InvoiceStatus.PAID
      };
      const dto = createDto(ListInvoiceDto, input);
      const response = {
        data: [{ id: 1, amount: 1000, status: InvoiceStatus.PAID }],
        meta: { total: 1, page: 1, limit: 10, last_page: 1 },
      };
      mockPaymentClient.send.mockReturnValue(of(response));

      const result = await firstValueFrom(
        controller.listInvoices(dto) as Observable<typeof response>,
      );

      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'list_invoices' },
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: 'hóa đơn',
          status: InvoiceStatus.PAID,
        }),
      );
      expect(result).toEqual(response);
    });

    it('should propagate error thrown by the service', async () => {
      const errorMessage = 'Lỗi truy vấn hóa đơn';
      const rpcError = new RpcException(errorMessage);
      mockPaymentClient.send.mockReturnValue(throwError(() => rpcError));

      await expect(
        firstValueFrom(
          controller.listInvoices({
            page: 1,
            limit: 10,
            status: InvoiceStatus.PENDING,
          }) as Observable<unknown>,
        ),
      ).rejects.toThrow(errorMessage);
      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'list_invoices' },
        expect.objectContaining({
          page: 1,
          limit: 10,
          status: InvoiceStatus.PENDING,
        }),
      );
    });

    describe('ListInvoiceDto validation', () => {
      it('should pass validation with correct data', async () => {
        const input: Partial<ListInvoiceDto> = {
          page: 1,
          limit: 10,
          search: 'hóa đơn',
          status: InvoiceStatus.PAID,
        };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto).toEqual({
          page: 1,
          limit: 10,
          search: 'hóa đơn',
          status: InvoiceStatus.PAID,
        });
      });

      it('should pass validation with string inputs for page, limit, and status', async () => {
        const input: RawListInvoiceDto = {
          page: '1',
          limit: '10',
          search: 'hóa đơn',
          status: '2', // Numeric string for InvoiceStatus.PAID
        };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto).toEqual({
          page: 1,
          limit: 10,
          search: 'hóa đơn',
          status: InvoiceStatus.PAID,
        });
      });

      it('should apply default values if optional fields are missing', async () => {
        const dto = createDto(ListInvoiceDto, {});
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto).toEqual({ page: PAGE, limit: LIMIT });
      });

      it('should fail validation if page is not an integer', async () => {
        const input: RawListInvoiceDto = { page: 'abc' };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('page');
        expect(errors[0].constraints?.isInt).toContain(
          'page must be an integer number',
        );
      });

      it('should fail validation if page is less than 1', async () => {
        const input: Partial<ListInvoiceDto> = { page: 0 };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('page');
        expect(errors[0].constraints?.min).toContain(
          'page must not be less than 1',
        );
      });

      it('should fail validation if limit is out of range', async () => {
        const input: Partial<ListInvoiceDto> = { limit: 200 };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('limit');
        expect(errors[0].constraints?.max).toContain(
          'limit must not be greater than 100',
        );
      });

      it('should fail validation if search is not a string', async () => {
        const input: RawListInvoiceDto = { search: 123 };
        const dto = createDto(ListInvoiceDto, input, {
          enableImplicitConversion: false,
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('search');
        expect(errors[0].constraints?.isString).toBe('search must be a string');
      });

      it('should fail validation if status is not a valid enum value', async () => {
        const input: RawListInvoiceDto = { status: 'INVALID' };
        const dto = createDto(ListInvoiceDto, input);
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('status');
        expect(errors[0].constraints?.isEnum).toContain(
          'status must be one of the following values: 1, 2, 3',
        );
      });
    });
  });

  describe('getInvoiceById', () => {
    it('should call paymentClient.send with correct id and lang', async () => {
      const id = 1;
      const response = {
        id,
        amount: 1000,
        status: InvoiceStatus.PAID,
        created_at: new Date(),
      };
      mockPaymentClient.send.mockReturnValue(of(response));

      const result = await firstValueFrom(
        controller.getInvoiceById(id) as Observable<typeof response>,
      );

      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'get_invoice_by_id' },
        { id, lang: 'vi' },
      );
      expect(result).toEqual(response);
    });

    it('should throw RpcException if invoice not found', async () => {
      const id = 1;
      const errorMessage = 'Hóa đơn không tồn tại';
      mockPaymentClient.send.mockReturnValue(
        throwError(() => new RpcException(errorMessage)),
      );

      await expect(
        firstValueFrom(controller.getInvoiceById(id) as Observable<unknown>),
      ).rejects.toThrow(errorMessage);
      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'get_invoice_by_id' },
        { id, lang: 'vi' },
      );
    });

    it('should use default lang "vi" if I18nContext is not available', async () => {
      jest.spyOn(I18nContext, 'current').mockReturnValue(undefined);
      const id = 1;
      const response = { id, amount: 1000, status: InvoiceStatus.PAID };
      mockPaymentClient.send.mockReturnValue(of(response));

      const result = await firstValueFrom(
        controller.getInvoiceById(id) as Observable<typeof response>,
      );

      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'get_invoice_by_id' },
        { id, lang: 'vi' },
      );
      expect(result).toEqual(response);
    });

    it('should use provided lang from I18nContext', async () => {
      jest.spyOn(I18nContext, 'current').mockReturnValue({
        lang: 'en',
      } as I18nContext<unknown>);

      const id = 1;
      const response = { id, amount: 1000, status: InvoiceStatus.PAID };
      mockPaymentClient.send.mockReturnValue(of(response));

      const result = await firstValueFrom(
        controller.getInvoiceById(id) as Observable<typeof response>,
      );

      expect(mockPaymentClient.send).toHaveBeenCalledWith(
        { cmd: 'get_invoice_by_id' },
        { id, lang: 'en' },
      );
      expect(result).toEqual(response);
    });
  });
});
