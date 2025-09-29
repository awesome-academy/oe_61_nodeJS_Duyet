/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ListInvoiceDto } from '@app/common';

describe('PaymentController', () => {
  let paymentController: PaymentController;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            listInvoices: jest.fn(),
            getInvoiceById: jest.fn(),
          },
        },
      ],
    }).compile();

    paymentController = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe('listInvoices', () => {
    it('should call paymentService.listInvoices with correct dto', () => {
      const listInvoiceDto: ListInvoiceDto = {
        page: 1,
        limit: 5,
        search: 'INV001',
        status: 1, // assuming InvoiceStatus = enum
      };
      const result = {
        data: [],
        meta: { total: 0, page: 1, limit: 5, last_page: 1 },
      };

      (paymentService.listInvoices as jest.Mock).mockReturnValue(result);

      expect(paymentController.listInvoices(listInvoiceDto)).toBe(result);
      expect(paymentService.listInvoices).toHaveBeenCalledWith(listInvoiceDto);
    });
  });

  describe('getInvoiceById', () => {
    it('should call paymentService.getInvoiceById with correct id and lang', () => {
      const payload = { id: 1, lang: 'vi' };
      const result = { id: 1, total: 100000, status: 1 };

      (paymentService.getInvoiceById as jest.Mock).mockReturnValue(result);

      expect(paymentController.getInvoiceById(payload)).toBe(result);
      expect(paymentService.getInvoiceById).toHaveBeenCalledWith(
        payload.id,
        payload.lang,
      );
    });
  });
});
