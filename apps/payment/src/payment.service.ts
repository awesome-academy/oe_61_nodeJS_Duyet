import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '@app/database';
import { Repository } from 'typeorm';
import { ListInvoiceDto, PAGE, LIMIT } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly i18n: I18nService,
  ) {}

  async listInvoices(listInvoiceDto: ListInvoiceDto) {
    const page =
      listInvoiceDto.page && listInvoiceDto.page > 0
        ? listInvoiceDto.page
        : PAGE;
    const limit =
      listInvoiceDto.limit && listInvoiceDto.limit > 0
        ? listInvoiceDto.limit
        : LIMIT;
    const { search, status } = listInvoiceDto;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .orderBy('invoice.issued_date', 'DESC');

    queryBuilder.select([
      'invoice.id',
      'invoice.invoice_code',
      'invoice.total_amount',
      'invoice.status',
      'invoice.issued_date',
      'booking.id',
      'user.id',
      'user.name',
      'user.email',
    ]);

    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoice_code LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, last_page: Math.ceil(total / limit) },
    };
  }

  async getInvoiceById(id: number, lang: string) {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.id = :id', { id })
      .leftJoinAndSelect('invoice.booking', 'booking')
      .leftJoinAndSelect('booking.bookingRooms', 'bookingRooms')
      .leftJoinAndSelect('bookingRooms.room', 'room')
      .leftJoinAndSelect('booking.bookingServices', 'bookingServices')
      .leftJoinAndSelect('bookingServices.service', 'service')
      .leftJoinAndSelect('invoice.details', 'details')
      .leftJoinAndSelect('invoice.promotion', 'promotion')
      .leftJoin('booking.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.email', 'user.phone'])
      .leftJoin('invoice.staff', 'staff')
      .addSelect(['staff.id', 'staff.name']);

    const invoice = await queryBuilder.getOne();

    if (!invoice) {
      throw new RpcException({
        message: this.i18n.t('invoice.NOT_FOUND', { lang, args: { id } }),
        status: 404,
      });
    }

    return invoice;
  }
}
