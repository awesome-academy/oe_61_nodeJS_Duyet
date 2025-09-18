import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard, ListInvoiceDto, Roles, RolesGuard } from '@app/common';
import { ParseId } from '@app/common/decorators/parse-id.decorator';
import { I18nContext } from 'nestjs-i18n';

@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminInvoiceController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  @Get()
  @Roles('admin', 'staff')
  listInvoices(@Query() listInvoiceDto: ListInvoiceDto) {
    return this.paymentClient.send({ cmd: 'list_invoices' }, listInvoiceDto);
  }

  @Get(':id')
  @Roles('admin', 'staff')
  getInvoiceById(@ParseId('id') id: number) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.paymentClient.send({ cmd: 'get_invoice_by_id' }, { id, lang });
  }
}
