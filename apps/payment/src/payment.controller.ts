import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ListInvoiceDto } from '@app/common';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'list_invoices' })
  listInvoices(@Payload() listInvoiceDto: ListInvoiceDto) {
    return this.paymentService.listInvoices(listInvoiceDto);
  }

  @MessagePattern({ cmd: 'get_invoice_by_id' })
  getInvoiceById(@Payload() payload: { id: number; lang: string }) {
    return this.paymentService.getInvoiceById(payload.id, payload.lang);
  }
}
