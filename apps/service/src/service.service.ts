import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateServiceDto,
  ListServiceDto,
  UpdateServiceDto,
} from '@app/common';
import { LIMIT, PAGE } from '@app/common/constants/database.constants';
import { BookingService, Service } from '@app/database';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(BookingService)
    private readonly bookingServiceRepository: Repository<BookingService>,
    private readonly i18n: I18nService,
  ) {}

  async listServices(listServiceDto: ListServiceDto) {
    const { page = PAGE, limit = LIMIT, search } = listServiceDto;

    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (search) {
      const escapeSearch = search.replace(/[%_]/g, (s) => `\\${s}`);
      queryBuilder.where(
        "(LOWER(service.name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(service.description) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapeSearch}%` },
      );
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async createService(payload: {
    createServiceDto: CreateServiceDto;
    lang: string;
  }) {
    const { createServiceDto, lang } = payload;

    const existingService = await this.serviceRepository.findOneBy({
      name: createServiceDto.name,
    });
    if (existingService) {
      throw new RpcException({
        message: this.i18n.t('service.EXISTS', { lang }),
        status: 409, // Conflict
      });
    }

    const newService = this.serviceRepository.create(createServiceDto);
    const savedService = await this.serviceRepository.save(newService);

    return {
      status: true,
      message: this.i18n.t('service.CREATED_SUCCESS', { lang }),
      data: savedService,
    };
  }

  async updateService(payload: {
    id: number;
    updateServiceDto: UpdateServiceDto;
    lang: string;
  }) {
    const { id, updateServiceDto, lang } = payload;

    const service = await this.serviceRepository.findOneBy({ id });
    if (!service) {
      throw new RpcException({
        message: this.i18n.t('service.NOT_FOUND', { lang, args: { id } }),
        status: 404, // Not Found
      });
    }

    if (updateServiceDto.name) {
      const existing = await this.serviceRepository.findOne({
        where: {
          name: updateServiceDto.name,
          id: Not(id),
        },
      });

      if (existing) {
        throw new RpcException({
          message: this.i18n.t('service.EXISTS', { lang }),
          status: 400,
        });
      }
    }

    await this.serviceRepository.update(id, updateServiceDto);
    const updatedService = await this.serviceRepository.findOneBy({ id });

    return {
      status: true,
      message: this.i18n.t('service.UPDATED_SUCCESS', { lang }),
      data: updatedService,
    };
  }

  async deleteService(payload: { id: number; lang: string }) {
    const { id, lang } = payload;
    const service = await this.serviceRepository.findOneBy({ id });
    if (!service) {
      throw new RpcException({
        message: this.i18n.t('service.NOT_FOUND', { lang, args: { id } }),
        status: 404,
      });
    }

    const related = await this.bookingServiceRepository.findOne({
      where: { service_id: id },
    });
    if (related) {
      throw new RpcException({
        message: this.i18n.t('service.DELETE_CONFLICT', {
          lang,
          args: { id },
        }),
        status: 400, // Bad Request
      });
    }

    await this.serviceRepository.delete(id);

    return {
      status: true,
      message: this.i18n.t('service.DELETED_SUCCESS', { lang }),
      data: service,
    };
  }
}
