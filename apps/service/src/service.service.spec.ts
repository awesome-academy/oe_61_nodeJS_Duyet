/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from '@app/database';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import {
  CreateServiceDto,
  ListServiceDto,
  UpdateServiceDto,
} from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

describe('ServiceService', () => {
  let service: ServiceService;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let i18nService: jest.Mocked<I18nService>;

  // Create a mock for the QueryBuilder to control its behavior
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: getRepositoryToken(Service),
          useValue: createMock<Repository<Service>>({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          }),
        },
        {
          provide: I18nService,
          useValue: createMock<I18nService>(),
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    serviceRepository = module.get(getRepositoryToken(Service));
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for listServices ---
  describe('listServices', () => {
    it('should apply search filter and pagination', async () => {
      const dto: ListServiceDto = { page: 2, limit: 15, search: 'laundry' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listServices(dto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "(LOWER(service.name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(service.description) LIKE LOWER(:search) ESCAPE '\\')",
        { search: '%laundry%' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(15); // (2-1)*15
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
    });

    it('should not apply search filter if search term is not provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listServices({});
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });
  });

  // --- Test Suite for createService ---
  describe('createService', () => {
    const payload = {
      createServiceDto: { name: 'New Service' } as CreateServiceDto,
      lang: 'en',
    };

    it('should create and return a new service with a success message', async () => {
      serviceRepository.findOneBy.mockResolvedValue(null);
      const newService = { id: 1, ...payload.createServiceDto } as Service;
      serviceRepository.create.mockReturnValue(newService);
      serviceRepository.save.mockResolvedValue(newService);

      const result = await service.createService(payload);

      expect(result.status).toBe(true);
      expect(result.data).toEqual(newService);
      expect(i18nService.t).toHaveBeenCalledWith('service.CREATED_SUCCESS', {
        lang: 'en',
      });
    });

    it('should throw an RpcException if the service name already exists', async () => {
      serviceRepository.findOneBy.mockResolvedValue({ id: 1 } as Service);
      await expect(service.createService(payload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('service.EXISTS', {
        lang: 'en',
      });
    });
  });

  // --- Test Suite for updateService ---
  describe('updateService', () => {
    const payload = {
      id: 1,
      updateServiceDto: { name: 'Updated Service' } as UpdateServiceDto,
      lang: 'en',
    };
    const existingService = { id: 1, name: 'Old Service' } as Service;

    it('should update and return the service if it exists', async () => {
      serviceRepository.findOneBy.mockResolvedValue(existingService);
      serviceRepository.update.mockResolvedValue({} as UpdateResult);
      // Mock the second findOneBy call to return the updated data
      serviceRepository.findOneBy.mockResolvedValue({
        ...existingService,
        ...payload.updateServiceDto,
      });

      const result = await service.updateService(payload);

      expect(serviceRepository.update).toHaveBeenCalledWith(
        payload.id,
        payload.updateServiceDto,
      );
      expect(result.status).toBe(true);
      expect(result.data!.name).toBe('Updated Service');
    });

    it('should throw an RpcException if the service is not found', async () => {
      serviceRepository.findOneBy.mockResolvedValue(null);
      await expect(service.updateService(payload)).rejects.toThrow(
        RpcException,
      );
      expect(i18nService.t).toHaveBeenCalledWith('service.NOT_FOUND', {
        lang: 'en',
        args: { id: payload.id },
      });
    });
  });

  // --- Test Suite for deleteService ---
  describe('deleteService', () => {
    const payload = { id: 1, lang: 'en' };
    const existingService = { id: 1, name: 'Service to Delete' } as Service;

    it('should delete and return the service if it exists', async () => {
      serviceRepository.findOneBy.mockResolvedValue(existingService);
      serviceRepository.delete.mockResolvedValue({} as DeleteResult);

      const result = await service.deleteService(payload);

      expect(serviceRepository.delete).toHaveBeenCalledWith(payload.id);
      expect(result.status).toBe(true);
      expect(result.data).toEqual(existingService);
    });

    it('should throw an RpcException if the service to delete is not found', async () => {
      serviceRepository.findOneBy.mockResolvedValue(null);
      await expect(service.deleteService(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });
});
